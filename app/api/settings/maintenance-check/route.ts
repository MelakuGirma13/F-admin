import { NextResponse } from "next/server"
import { isMaintenanceMode } from "@/lib/setting-utils/settings-utils" // Or from settings-client if preferred

export async function GET() {
  try {
    const value = await isMaintenanceMode()
    return NextResponse.json({ maintenance: value })
  } catch (e) {
    console.error("Maintenance API error:", e)
    return NextResponse.json({ maintenance: false }, { status: 200 })
  }
}
