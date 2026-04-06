import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Shield, Mail, Users, Bell, Palette } from "lucide-react"
import db from "@/lib/db"
import { SettingsForm } from "@/components/auth/settings/settings-form"

export default async function SettingsPage() {
  const session = await auth()

  // Check if user has permission to manage system settings
  if (!session || !hasPermission(session.user, "system:settings")) {
    redirect("/unauthorized")
  }

  // Fetch all settings grouped by category
  const settings = await db.setting.findMany({
    orderBy: [{ category: "asc" }, { key: "asc" }],
  })

  // Group settings by category
  const settingsByCategory = settings.reduce(
    (acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = []
      }
      acc[setting.category].push(setting)
      return acc
    },
    {} as Record<string, typeof settings>,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <SettingsForm category="general" settings={settingsByCategory.general || []} />
        </TabsContent>

        <TabsContent value="security">
          <SettingsForm category="security" settings={settingsByCategory.security || []} />
        </TabsContent>

        <TabsContent value="email">
          <SettingsForm category="email" settings={settingsByCategory.email || []} />
        </TabsContent>

        <TabsContent value="users">
          <SettingsForm category="users" settings={settingsByCategory.users || []} />
        </TabsContent>

        <TabsContent value="notifications">
          <SettingsForm category="notifications" settings={settingsByCategory.notifications || []} />
        </TabsContent>

        <TabsContent value="appearance">
          <SettingsForm category="appearance" settings={settingsByCategory.appearance || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
