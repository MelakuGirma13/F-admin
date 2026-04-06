import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"

// Schema for updating settings
const updateSettingsSchema = z.object({
  category: z.string(),
  settings: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
      category: z.string(),
      type: z.string(),
      description: z.string().optional(),
    }),
  ),
})

// GET /api/settings - Get all settings or settings by category
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const publicOnly = searchParams.get("public") === "true"

    // If requesting public settings, no authentication required
    if (publicOnly) {
      const settings = await prisma.setting.findMany({
        where: {
          isPublic: true,
          ...(category && { category }),
        },
        select: {
          key: true,
          value: true,
          category: true,
          type: true,
        },
      })
      return NextResponse.json(settings)
    }

    // For non-public settings, check permissions
    if (!session || !hasPermission(session.user, "system:settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const settings = await prisma.setting.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "An error occurred while fetching settings" }, { status: 500 })
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    // Check if user has permission to manage system settings
    if (!session || !hasPermission(session.user, "system:settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const result = updateSettingsSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.format() }, { status: 400 })
    }

    const { category, settings } = result.data

    // Update or create settings
    const updatedSettings = await Promise.all(
      settings.map(async (setting) => {
        return await prisma.setting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            type: setting.type,
            description: setting.description,
          },
          create: {
            key: setting.key,
            value: setting.value,
            category: setting.category,
            type: setting.type,
            description: setting.description,
            isPublic: false, // Default to private
          },
        })
      }),
    )

    return NextResponse.json({ success: true, settings: updatedSettings })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "An error occurred while updating settings" }, { status: 500 })
  }
}

// POST /api/settings - Create a new setting
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Check if user has permission to manage system settings
    if (!session || !hasPermission(session.user, "system:settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()

    const settingSchema = z.object({
      key: z.string().min(1),
      value: z.string(),
      category: z.string().min(1),
      type: z.string().default("string"),
      description: z.string().optional(),
      isPublic: z.boolean().default(false),
    })

    const result = settingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.format() }, { status: 400 })
    }

    const setting = await prisma.setting.create({
      data: result.data,
    })

    return NextResponse.json(setting, { status: 201 })
  } catch (error) {
    console.error("Error creating setting:", error)
    return NextResponse.json({ error: "An error occurred while creating the setting" }, { status: 500 })
  }
}
