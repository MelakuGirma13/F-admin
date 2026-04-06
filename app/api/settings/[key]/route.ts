import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"

// GET /api/settings/[key] - Get a specific setting
export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const session = await auth()
    const settingKey = params.key

    const setting = await prisma.setting.findUnique({
      where: { key: settingKey },
    })

    if (!setting) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 })
    }

    // If setting is not public, check permissions
    if (!setting.isPublic) {
      if (!session || !hasPermission(session.user, "system:settings")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    return NextResponse.json(setting)
  } catch (error) {
    console.error("Error fetching setting:", error)
    return NextResponse.json({ error: "An error occurred while fetching the setting" }, { status: 500 })
  }
}

// PUT /api/settings/[key] - Update a specific setting
export async function PUT(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const session = await auth()

    // Check if user has permission to manage system settings
    if (!session || !hasPermission(session.user, "system:settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const settingKey = params.key
    const body = await request.json()

    const updateSchema = z.object({
      value: z.string(),
      description: z.string().optional(),
      isPublic: z.boolean().optional(),
    })

    const result = updateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.format() }, { status: 400 })
    }

    const setting = await prisma.setting.update({
      where: { key: settingKey },
      data: result.data,
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error("Error updating setting:", error)
    return NextResponse.json({ error: "An error occurred while updating the setting" }, { status: 500 })
  }
}

// DELETE /api/settings/[key] - Delete a specific setting
export async function DELETE(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const session = await auth()

    // Check if user has permission to manage system settings
    if (!session || !hasPermission(session.user, "system:settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const settingKey = params.key

    await prisma.setting.delete({
      where: { key: settingKey },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting setting:", error)
    return NextResponse.json({ error: "An error occurred while deleting the setting" }, { status: 500 })
  }
}
