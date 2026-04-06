import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// Schema for changing password
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
})

// PUT /api/profile/password - Change user's password
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const result = changePasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.format() }, { status: 400 })
    }

    const { currentPassword, newPassword } = result.data

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const passwordsMatch = await bcrypt.compare(currentPassword, user.password)
    if (!passwordsMatch) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: session.user?.id },
      data: {
        password: hashedNewPassword,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "An error occurred while changing password" }, { status: 500 })
  }
}
