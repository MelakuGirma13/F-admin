
"use client"

import { useState, useEffect } from "react"

/*
**React Hooks (`hooks/use-settings.ts`)**:
- `useSettings` - General hook for fetching settings
- `useAppConfig` - Specific hook for app configuration
- `useAppearanceConfig` - Hook for theme settings
- `useUserConfig` - Hook for user management settings
 */

interface Setting {
  key: string
  value: string
  category: string
  type: string
}

interface UseSettingsOptions {
  category?: string
  publicOnly?: boolean
  refreshInterval?: number
}

export function useSettings(options: UseSettingsOptions = {}) {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { category, publicOnly = true, refreshInterval } = options

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (category) params.append("category", category)
      if (publicOnly) params.append("public", "true")

      const response = await fetch(`/api/settings?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch settings")
      }

      const data = await response.json()
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()

    // Set up refresh interval if specified
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchSettings, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [category, publicOnly, refreshInterval])

  // Convert settings array to object for easier access
  const settingsObject = settings.reduce(
    (acc, setting) => {
      let value: any = setting.value

      // Convert value based on type
      switch (setting.type) {
        case "boolean":
          value = setting.value === "true"
          break
        case "number":
          value = Number(setting.value)
          break
        case "json":
          try {
            value = JSON.parse(setting.value)
          } catch {
            value = setting.value
          }
          break
      }

      acc[setting.key] = value
      return acc
    },
    {} as Record<string, any>,
  )

  const getSetting = (key: string, defaultValue?: any) => {
    return settingsObject[key] ?? defaultValue
  }

  const refresh = () => {
    fetchSettings()
  }

  return {
    settings,
    settingsObject,
    getSetting,
    loading,
    error,
    refresh,
  }
}

// Specific hooks for different setting categories
export function useAppConfig() {
  const { settingsObject, loading, error } = useSettings({
    category: "general",
    publicOnly: true,
  })

  return {
    appName: settingsObject.app_name || "User Management System",
    appDescription: settingsObject.app_description || "A robust and scalable User Management System with RBAC",
    appLogoUrl: settingsObject.app_logo_url || "",
    maintenanceMode: settingsObject.maintenance_mode || false,
    loading,
    error,
  }
}

export function useAppearanceConfig() {
  const { settingsObject, loading, error } = useSettings({
    category: "appearance",
    publicOnly: true,
  })

  return {
    themePrimaryColor: settingsObject.theme_primary_color || "#3b82f6",
    themeSecondaryColor: settingsObject.theme_secondary_color || "#64748b",
    enableDarkMode: settingsObject.enable_dark_mode !== false,
    defaultTheme: settingsObject.default_theme || "system",
    loading,
    error,
  }
}

export function useUserConfig() {
  const { settingsObject, loading, error } = useSettings({
    category: "users",
    publicOnly: true,
  })

  return {
    allowRegistration: settingsObject.allow_registration !== false,
    loading,
    error,
  }
}
