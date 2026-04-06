import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import db from "@/lib/db"

// POST /api/profile/avatar - Upload user avatar
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("avatar") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // In a real application, you would upload the file to a cloud storage service
    // For this example, we'll just create a placeholder URL
    // TODO: Implement actual file upload to cloud storage (AWS S3, Cloudinary, etc.)

    const avatarUrl = `/uploads/avatars/${session.user?.id}-${Date.now()}.${file.type.split("/")[1]}`

    // Update user's avatar URL in database
    const updatedUser = await db.user.update({
      where: { id: session.user?.id },
      data: {
        image: avatarUrl,
      },
      select: {
        id: true,
        image: true,
      },
    })

    return NextResponse.json({ avatarUrl: updatedUser.image })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return NextResponse.json({ error: "An error occurred while uploading avatar" }, { status: 500 })
  }
}
