import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { hashToken } from "@/lib/token-utils"

// Schema for reset password request
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const result = resetPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.format() }, { status: 400 })
    }

    const { token, password } = result.data

    // Hash the token to compare with the stored hash
    const hashedToken = hashToken(token)

    // Find the password reset record
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token: hashedToken },
    })

    // Check if the token exists and is valid
    if (!passwordReset) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    // Check if the token has expired
    if (new Date() > passwordReset.expires) {
      // Delete the expired token
      await prisma.passwordReset.delete({
        where: { id: passwordReset.id },
      })
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 })
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: passwordReset.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Delete the used token
    await prisma.passwordReset.delete({
      where: { id: passwordReset.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "An error occurred while resetting your password" }, { status: 500 })
  }
}
