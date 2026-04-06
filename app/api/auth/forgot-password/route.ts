import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateToken, hashToken, createTokenExpiry } from "@/lib/token-utils"
import db from "@/lib/db"

// Schema for forgot password request
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const result = forgotPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    const { email } = result.data

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
    })

    // For security reasons, don't reveal if the email exists or not
    // Just return success even if the email doesn't exist
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Generate a reset token
    const resetToken = generateToken()
    const hashedToken = hashToken(resetToken)
    const expires = createTokenExpiry(1) // Token expires in 1 hour

    // Delete any existing reset tokens for this user
    await db.passwordReset.deleteMany({
      where: { email },
    })

    // Create a new reset token
    await db.passwordReset.create({
      data: {
        email,
        token: hashedToken,
        expires,
      },
    })

    // In a real application, you would send an email with the reset link
    // For this example, we'll just log it to the console
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`
    console.log(`Password reset link for ${email}: ${resetUrl}`)

    // TODO: Send email with reset link
    // Example: await sendResetEmail(email, resetUrl)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 })
  }
}
