
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

import { AppSettings, defaultSettings, SettingsContextType } from "./setting-types"

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/settings?public=true")

      if (!response.ok) {
        throw new Error("Failed to fetch settings")
      }

      const data = await response.json()

      // Convert array to settings object
      const settingsObject = data.reduce((acc: any, setting: any) => {
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
      }, {})

      setSettings({
        appName: settingsObject.app_name || defaultSettings.appName,
        appDescription: settingsObject.app_description || defaultSettings.appDescription,
        appLogoUrl: settingsObject.app_logo_url || defaultSettings.appLogoUrl,
        maintenanceMode: settingsObject.maintenance_mode || defaultSettings.maintenanceMode,
        allowRegistration: settingsObject.allow_registration ?? defaultSettings.allowRegistration,
        themePrimaryColor: settingsObject.theme_primary_color || defaultSettings.themePrimaryColor,
        themeSecondaryColor: settingsObject.theme_secondary_color || defaultSettings.themeSecondaryColor,
        enableDarkMode: settingsObject.enable_dark_mode ?? defaultSettings.enableDarkMode,
        defaultTheme: settingsObject.default_theme || defaultSettings.defaultTheme,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const refreshSettings = () => {
    fetchSettings()
  }

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useGlobalSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useGlobalSettings must be used within a SettingsProvider")
  }
  return context
}
