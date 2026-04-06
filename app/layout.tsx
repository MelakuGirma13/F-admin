import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import Providers from "./providers"

import { Agentation } from "agentation"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/side-bar/app-sidebar"
import { SiteHeader } from "@/components/side-bar/site-header"

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://admin.ecommerce-2026.com"),
  title: {
    default: "E-commerce Admin Dashboard",
    template: "%s | E-commerce Admin",
  },
  description:
    "Powerful admin dashboard to manage products, orders, customers, and inventory for the E-commerce 2026 platform.",
  keywords: [
    "e-commerce admin",
    "ecommerce dashboard",
    "order management",
    "product management",
    "inventory management",
    "E-commerce 2026",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://admin.ecommerce-2026.com",
    siteName: "E-commerce 2026 Admin",
    title: "E-commerce Admin Dashboard",
    description:
      "Admin dashboard for managing products, orders, customers, analytics, and inventory.",
    images: [
      {
        url: "/admin-og.png",
        width: 1200,
        height: 630,
        alt: "E-commerce 2026 admin dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "E-commerce Admin Dashboard",
    description:
      "Control panel for managing products, orders, customers, and inventory on E-commerce 2026.",
    images: ["/admin-og.png"],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn("font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>

          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <SiteHeader />

              <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                  {children}
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
          {process.env.NODE_ENV === "development" && <Agentation />}
          
        </Providers>
      </body>
    </html>
  )
}
