import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import db from "@/lib/db"

// Schema for creating/updating permissions
const permissionSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .regex(/^[a-z]+:[a-z]+$/, {
      message: "Permission name must be in format 'resource:action' (e.g., users:read)",
    }),
  description: z.string().min(5, "Description must be at least 5 characters"),
})

// GET /api/permissions - List permissions
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Check if user has permission to read permissions
    if (!session || !hasPermission(session.user, "permissions:read")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch permissions with their roles count
    const permissions = await db.permission.findMany({
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
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    // Get total count for pagination
    const totalPermissions = await db.permission.count({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
    })

    // Format permissions
    const formattedPermissions = permissions.map((permission) => ({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      rolesCount: permission._count.rolePermissions,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    }))

    return NextResponse.json({
      permissions: formattedPermissions,
      pagination: {
        total: totalPermissions,
        page,
        limit,
        pages: Math.ceil(totalPermissions / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ error: "An error occurred while fetching permissions" }, { status: 500 })
  }
}

// POST /api/permissions - Create a new permission
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Check if user has permission to create permissions
    if (!session || !hasPermission(session.user, "permissions:create")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const result = permissionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.format() }, { status: 400 })
    }

    const { name, description } = result.data

    // Check if permission already exists
    const existingPermission = await db.permission.findUnique({
      where: { name },
    })

    if (existingPermission) {
      return NextResponse.json({ error: "Permission with this name already exists" }, { status: 400 })
    }

    // Create permission
    const permission = await db.permission.create({
      data: {
        name,
        description,
      },
    })

    return NextResponse.json(
      {
        id: permission.id,
        name: permission.name,
        description: permission.description,
        createdAt: permission.createdAt,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating permission:", error)
    return NextResponse.json({ error: "An error occurred while creating the permission" }, { status: 500 })
  }
}
