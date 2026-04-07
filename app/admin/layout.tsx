import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/side-bar/app-sidebar"
import { SiteHeader } from "@/components/side-bar/site-header"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const session = await auth();
    if (!session) {
        redirect("/login")
    }

    return (
        <SidebarProvider>
            <AppSidebar
                user={
                    session.user
                        ? {
                            name: session.user.name ?? "",
                            email: session.user.email ?? "",
                            avatar: session.user.image ?? "",
                        }
                        : undefined
                }
            />
            <SidebarInset>
                <SiteHeader />
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
