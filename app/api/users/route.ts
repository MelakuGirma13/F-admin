import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import db from "@/lib/db"

// Schema for creating/updating users
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  roleIds: z.array(z.string()).optional(),
})

// GET /api/users - List users
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Check if user has permission to read users
    if (!session || !hasPermission(session.user, "users:read")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch users with their roles
    const users = await db.user.findMany({
      skip,
      take: limit,
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Get total count for pagination
    const totalUsers = await db.user.count({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
    })

    // Format users to exclude password
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "An error occurred while fetching users" }, { status: 500 })
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Check if user has permission to create users
    if (!session || !hasPermission(session.user, "users:create")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const result = userSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.format() }, { status: 400 })
    }

    const { name, email, password, roleIds } = result.data

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || Math.random().toString(36).slice(-8), 10)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Assign roles if provided
    if (roleIds && roleIds.length > 0) {
      const roleAssignments = roleIds.map((roleId) => ({
        userId: user.id,
        roleId,
      }))

      await db.userRole.createMany({
        data: roleAssignments,
      })
    } else {
      // Assign default role (User) if no roles provided
      const userRole = await db.role.findFirst({
        where: { name: "User" },
      })

      if (userRole) {
        await db.userRole.create({
          data: {
            userId: user.id,
            roleId: userRole.id,
          },
        })
      }
    }

    // Return user without password
    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "An error occurred while creating the user" }, { status: 500 })
  }
}
