import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import db from "@/lib/db"

// Schema for updating users
const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  roleIds: z.array(z.string()).optional(),
})

// GET /api/users/[id] - Get a specific user
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string } >}) {
  try {
    const session = await auth()

    // Check if user has permission to read users
    if (!session || !hasPermission(session.user, "users:read")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const {id:userId} = await params

    // Fetch user with their roles
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Format user to exclude password
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    return NextResponse.json(formattedUser)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "An error occurred while fetching the user" }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    // Check if user has permission to update users
    if (!session || !hasPermission(session.user, "users:update")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const {id:userId} = await params
    const body = await request.json()

    // Validate input
    const result = updateUserSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.format() }, { status: 400 })
    }

    const { name, email, password, roleIds } = result.data

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await db.user.findUnique({
        where: { email },
      })

      if (emailTaken) {
        return NextResponse.json({ error: "Email is already taken" }, { status: 400 })
      }
    }

    // Update user data
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (password) updateData.password = await bcrypt.hash(password, 10)

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
    })

    // Update roles if provided
    if (roleIds) {
      // Delete existing role assignments
      await db.userRole.deleteMany({
        where: { userId },
      })

      // Create new role assignments
      if (roleIds.length > 0) {
        const roleAssignments = roleIds.map((roleId) => ({
          userId,
          roleId,
        }))

        await db.userRole.createMany({
          data: roleAssignments,
        })
      }
    }

    // Return updated user without password
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      updatedAt: updatedUser.updatedAt,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "An error occurred while updating the user" }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }>}) {
  try {
    const session = await auth()

    // Check if user has permission to delete users
    if (!session || !hasPermission(session.user, "users:delete")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const {id:userId} = await params

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete user (cascade will delete userRoles)
    await db.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "An error occurred while deleting the user" }, { status: 500 })
  }
}
