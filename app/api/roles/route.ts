import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import db from "@/lib/db"

// Schema for creating/updating roles
const roleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
})

// GET /api/roles - List roles
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Check if user has permission to read roles
    if (!session || !hasPermission(session.user, "roles:read")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch roles with their permissions
    const roles = await db.role.findMany({
      skip,
      take: limit,
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    // Get total count for pagination
    const totalRoles = await db.role.count({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
    })

    // Format roles
    const formattedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
      })),
      usersCount: role._count.userRoles,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }))

    return NextResponse.json({
      roles: formattedRoles,
      pagination: {
        total: totalRoles,
        page,
        limit,
        pages: Math.ceil(totalRoles / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "An error occurred while fetching roles" }, { status: 500 })
  }
}

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Check if user has permission to create roles
    if (!session || !hasPermission(session.user, "roles:create")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const result = roleSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.format() }, { status: 400 })
    }

    const { name, description, permissionIds } = result.data

    // Check if role already exists
    const existingRole = await db.role.findUnique({
      where: { name },
    })

    if (existingRole) {
      return NextResponse.json({ error: "Role with this name already exists" }, { status: 400 })
    }

    // Create role
    const role = await db.role.create({
      data: {
        name,
        description,
      },
    })

    // Assign permissions if provided
    if (permissionIds && permissionIds.length > 0) {
      const permissionAssignments = permissionIds.map((permissionId) => ({
        roleId: role.id,
        permissionId,
      }))

      await db.rolePermission.createMany({
        data: permissionAssignments,
      })
    }

    return NextResponse.json(
      {
        id: role.id,
        name: role.name,
        description: role.description,
        createdAt: role.createdAt,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating role:", error)
    return NextResponse.json({ error: "An error occurred while creating the role" }, { status: 500 })
  }
}
