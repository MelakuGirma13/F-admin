import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "./auth";

// Define protected routes and required permissions
const protectedRoutes = [
  // {
  //   path: "/admin",
  //   requiredPermission: null, // Any authenticated user can access
  // },
  {
    path: "/admin/users",
    requiredPermission: "users:read",
  },
  {
    path: "/admin/roles",
    requiredPermission: "roles:read",
  },
  {
    path: "/admin/permissions",
    requiredPermission: "permissions:read",
  },
  {
    path: "/admin/orders",
    requiredPermission: "orders:read",
  },
  {
    path: "/admin/products",
    requiredPermission: "products:read",
  }
]

export async function proxy(request: NextRequest) {
  // return await updateSession(request);

// First check maintenance mode
  // const maintenanceResponse = await checkMaintenanceMode(request);
  // if (maintenanceResponse) {
  //   return maintenanceResponse
  // }

  const session = await auth()
  const path = request.nextUrl.pathname

  // Check if the path is protected
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route.path))

  if (isProtectedRoute) {
    // If not authenticated, redirect to login
    if (!session) {
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", encodeURI(request.url))
      return NextResponse.redirect(url)
    }

    // Check for specific permission requirements
    const routeConfig = protectedRoutes.find((route) => path.startsWith(route.path))
    if (routeConfig?.requiredPermission) {
      const hasRequiredPermission = session?.user?.roles?.some((role: any) =>
        role.permissions.some((permission: any) => permission.name === routeConfig.requiredPermission),
      )

      if (!hasRequiredPermission) {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
