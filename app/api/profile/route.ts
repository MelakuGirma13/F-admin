import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import db from "@/lib/db"

// Schema for updating profile
const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
})

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user?.id },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "An error occurred while fetching profile" }, { status: 500 })
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const result = updateProfileSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.format() }, { status: 400 })
    }

    const { name, email, bio } = result.data

    // Check if email is already taken by another user
    if (email !== session.user?.email) {
      const existingUser = await db.user.findUnique({
        where: { email },
      })

      if (existingUser && existingUser.id !== session.user?.id) {
        return NextResponse.json({ error: "Email is already taken" }, { status: 400 })
      }
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: session.user?.id },
      data: {
        name,
        email,
        bio: bio || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        image: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "An error occurred while updating profile" }, { status: 500 })
  }
}
