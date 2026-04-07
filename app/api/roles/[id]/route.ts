import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import db from "@/lib/db"

// Schema for updating roles
const updateRoleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
})

// GET /api/roles/[id] - Get a specific role
export async function GET(request: NextRequest, { params }: { params: Promise< { id: string }> }) {
  try {
    const session = await auth()

    // Check if user has permission to read roles
    if (!session || !hasPermission(session.user, "roles:read")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const {id:roleId }= await params

    // Fetch role with its permissions
    const role = await db.role.findUnique({
      where: { id: roleId },
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
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Format role
    const formattedRole = {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
      usersCount: role._count.userRoles,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }

    return NextResponse.json(formattedRole)
  } catch (error) {
    console.error("Error fetching role:", error)
    return NextResponse.json({ error: "An error occurred while fetching the role" }, { status: 500 })
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(request: NextRequest, { params }: { params: Promise< { id: string } >}) {
  try {
    const session = await auth()

    // Check if user has permission to update roles
    if (!session || !hasPermission(session.user, "roles:update")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const {id:roleId} = await params;
    const body = await request.json()

    // Validate input
    const result = updateRoleSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.format() }, { status: 400 })
    }

    const { name, description, permissionIds } = result.data

    // Check if role exists
    const existingRole = await db.role.findUnique({
      where: { id: roleId },
    })

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Check if name is already taken by another role
    if (name && name !== existingRole.name) {
      const nameTaken = await db.role.findUnique({
        where: { name },
      })

      if (nameTaken) {
        return NextResponse.json({ error: "Role name is already taken" }, { status: 400 })
      }
    }

    // Update role data
    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description

    const updatedRole = await db.role.update({
      where: { id: roleId },
      data: updateData,
    })

    // Update permissions if provided
    if (permissionIds) {
      // Delete existing permission assignments
      await db.rolePermission.deleteMany({
        where: { roleId },
      })

      // Create new permission assignments
      if (permissionIds.length > 0) {
        const permissionAssignments = permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        }))

        await db.rolePermission.createMany({
          data: permissionAssignments,
        })
      }
    }

    return NextResponse.json({
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description,
      updatedAt: updatedRole.updatedAt,
    })
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json({ error: "An error occurred while updating the role" }, { status: 500 })
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(request: NextRequest, { params }: { params: Promise< { id: string } >}) {
  try {
    const session = await auth()

    // Check if user has permission to delete roles
    if (!session || !hasPermission(session.user, "roles:delete")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const {id:roleId} = await params

    // Check if role exists
    const existingRole = await db.role.findUnique({
      where: { id: roleId },
    })

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Delete role (cascade will delete rolePermissions and userRoles)
    await db.role.delete({
      where: { id: roleId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json({ error: "An error occurred while deleting the role" }, { status: 500 })
  }
}
