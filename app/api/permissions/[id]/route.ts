import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import db from "@/lib/db"

// Schema for updating permissions
const updatePermissionSchema = z.object({
  description: z.string().min(5, "Description must be at least 5 characters"),
})

// GET /api/permissions/[id] - Get a specific permission
export async function GET(request: NextRequest, { params }: { params: Promise< { id: string }> }) {
  try {
    const session = await auth()

    // Check if user has permission to read permissions
    if (!session || !hasPermission(session.user, "permissions:read")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const {id:permissionId} = await params

    // Fetch permission with its roles
    const permission = await db.permission.findUnique({
      where: { id: permissionId },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!permission) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 })
    }

    // Format permission
    const formattedPermission = {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      roles: permission.rolePermissions.map((rp) => ({
        id: rp.role.id,
        name: rp.role.name,
        description: rp.role.description,
      })),
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    }

    return NextResponse.json(formattedPermission)
  } catch (error) {
    console.error("Error fetching permission:", error)
    return NextResponse.json({ error: "An error occurred while fetching the permission" }, { status: 500 })
  }
}

// PUT /api/permissions/[id] - Update a permission
export async function PUT(request: NextRequest, { params }: { params: Promise< { id: string }> }) {
  try {
    const session = await auth()

    // Check if user has permission to update permissions
    if (!session || !hasPermission(session.user, "permissions:update")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const {id:permissionId} = await params
    const body = await request.json()

    // Validate input
    const result = updatePermissionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.format() }, { status: 400 })
    }

    const { description } = result.data

    // Check if permission exists
    const existingPermission = await db.permission.findUnique({
      where: { id: permissionId },
    })

    if (!existingPermission) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 })
    }

    // Update permission data
    const updatedPermission = await db.permission.update({
      where: { id: permissionId },
      data: {
        description,
      },
    })

    return NextResponse.json({
      id: updatedPermission.id,
      name: updatedPermission.name,
      description: updatedPermission.description,
      updatedAt: updatedPermission.updatedAt,
    })
  } catch (error) {
    console.error("Error updating permission:", error)
    return NextResponse.json({ error: "An error occurred while updating the permission" }, { status: 500 })
  }
}

// DELETE /api/permissions/[id] - Delete a permission
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    // Check if user has permission to delete permissions
    if (!session || !hasPermission(session.user, "permissions:delete")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const permissionId = params.id

    // Check if permission exists
    const existingPermission = await db.permission.findUnique({
      where: { id: permissionId },
    })

    if (!existingPermission) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 })
    }

    // Delete permission (cascade will delete rolePermissions)
    await db.permission.delete({
      where: { id: permissionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting permission:", error)
    return NextResponse.json({ error: "An error occurred while deleting the permission" }, { status: 500 })
  }
}
