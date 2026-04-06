import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Exact paths that are always allowed during maintenance
const maintenanceExemptExactPaths = [
    "/api/settings",
    "/maintenance",
    "/favicon.ico",
    "/api/auth",
    "/login",
    "/register",
    "/dashboard",
  ]
  // Paths that allow deeper subpaths (e.g., _next/static, /dashboard/settings/edit)
  const maintenanceExemptPrefixPaths = [
    "/_next",
    "/dashboard/settings",
  ]
  
  // Paths that should redirect to /maintenance during active maintenance
  const maintenanceProtectedPaths = [
    "/dashboard/users",
    "/dashboard/roles",
    "/dashboard/permissions",
    "/dashboard/profile",
  ]
  
  export async function checkMaintenanceMode(request: NextRequest) {
    const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/" // Normalize trailing slashes  
  
    // ✅ Check for exemption
    const isExempt =
      maintenanceExemptExactPaths.includes(pathname) ||
      maintenanceExemptPrefixPaths.some(prefix => pathname.startsWith(prefix))
  
    if (isExempt) {
      console.log("✅ Exempt from maintenance:", pathname)
      return null
    }
  
    // ✅ Check if path is under maintenance control
    const isUnderMaintenanceControl = maintenanceProtectedPaths.some(protectedPath =>
      pathname === protectedPath || pathname.startsWith(`${protectedPath}/`)
    )
  
    if (!isUnderMaintenanceControl) {
      console.log("🟡 Not a maintenance-controlled path:", pathname)
      return null
    }
  
    console.log("⏳ Checking maintenance mode for:", pathname)
  
    // ✅ Fetch maintenance status
    try {
      const res = await fetch(`${request.nextUrl.origin}/api/settings/maintenance-check`, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })
  
      const data = await res.json()
      const isMaintenanceMode = data.maintenance === true || data.maintenance === "true"
  
      console.log("🔧 Maintenance mode:", isMaintenanceMode)
  
      if (isMaintenanceMode) {
        console.log("🔁 Redirecting to /maintenance")
        return NextResponse.redirect(new URL("/maintenance", request.url))
      }
    } catch (error) {
      console.error("❌ Error checking maintenance mode:", error)
    }
  
    return null
  }