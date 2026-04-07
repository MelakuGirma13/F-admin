import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 text-center">
      <Shield className="h-16 w-16 text-muted-foreground" />
      <h1 className="mt-6 text-3xl font-bold">Access Denied</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        You don't have permission to access this page. Please contact your administrator if you believe this is an
        error.
      </p>
      <div className="mt-6 flex gap-4">
        <Button asChild>
          <Link href="/admin">Go to admin</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go to Home</Link>
        </Button>
      </div>
    </div>
  )
}
