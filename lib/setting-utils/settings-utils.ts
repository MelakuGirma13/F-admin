import db from "../db"


export interface Setting {
  id: string
  key: string
  value: string
  category: string
  type: string
  description?: string | null
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

// Cache settings for better performance
const getSettingsFromDB = async (category?: string, publicOnly = false) => {
  return await db.setting.findMany({
    where: {
      ...(category && { category }),
      ...(publicOnly && { isPublic: true }),
    },
    orderBy: [{ category: "asc" }, { key: "asc" }],
  })
}

/**
 * Get a single setting by key
 */
export async function getSetting(key: string, publicOnly = false): Promise<Setting | null> {
  try {
    const setting = await db.setting.findUnique({
      where: { key },
    })

    if (!setting) return null
    if (publicOnly && !setting.isPublic) return null

    return setting
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error)
    return null
  }
}

/**
 * Get setting value by key with type conversion
 */
export async function getSettingValue<T = string>(key: string, defaultValue: T, publicOnly = false): Promise<T> {
  try {
    const setting = await getSetting(key, publicOnly)
    if (!setting) return defaultValue

    return convertSettingValue(setting.value, setting.type, defaultValue) as T
  } catch (error) {
    console.error(`Error getting setting value for ${key}:`, error)
    return defaultValue
  }
}

/**
 * Get multiple settings by category
 */
export async function getSettingsByCategory(category: string, publicOnly = false): Promise<Setting[]> {
  try {
    return await getSettingsFromDB(category, publicOnly)
  } catch (error) {
    console.error(`Error fetching settings for category ${category}:`, error)
    return []
  }
}

/**
 * Get all settings
 */
export async function getAllSettings(publicOnly = false): Promise<Setting[]> {
  try {
    return await getSettingsFromDB(undefined, publicOnly)
  } catch (error) {
    console.error("Error fetching all settings:", error)
    return []
  }
}

/**
 * Get settings as a key-value object
 */
export async function getSettingsAsObject(category?: string, publicOnly = false): Promise<Record<string, any>> {
  try {
    const settings = await getSettingsFromDB(category, publicOnly)
    const settingsObject: Record<string, any> = {}

    settings.forEach((setting) => {
      settingsObject[setting.key] = convertSettingValue(setting.value, setting.type, setting.value)
    })

    return settingsObject
  } catch (error) {
    console.error("Error converting settings to object:", error)
    return {}
  }
}

/**
 * Convert setting value based on type
 */
function convertSettingValue(value: string, type: string, defaultValue: any): any {
  try {
    switch (type) {
      case "boolean":
        return value === "true" || value === "1"
      case "number":
        const num = Number(value)
        return isNaN(num) ? defaultValue : num
      case "json":
        return JSON.parse(value)
      case "array":
        return value.split(",").map((item) => item.trim())
      default:
        return value
    }
  } catch (error) {
    console.error(`Error converting setting value: ${value} (type: ${type})`, error)
    return defaultValue
  }
}

/**
 * Check if a feature is enabled based on settings
 */
export async function isFeatureEnabled(featureKey: string, defaultValue = false): Promise<boolean> {
  return await getSettingValue(featureKey, defaultValue)
}

/**
 * Get application configuration
 */
export async function getAppConfig() {
  const settings = await getSettingsAsObject("general", true)

  return {
    appName: settings.app_name || "User Management System",
    appDescription: settings.app_description || "A robust and scalable User Management System with RBAC",
    appLogoUrl: settings.app_logo_url || "",
    maintenanceMode: settings.maintenance_mode || false,
  }
}

/**
 * Get security configuration
 */
export async function getSecurityConfig() {
  const settings = await getSettingsAsObject("security")

  return {
    passwordMinLength: settings.password_min_length || 6,
    passwordRequireUppercase: settings.password_require_uppercase || false,
    passwordRequireNumbers: settings.password_require_numbers || false,
    passwordRequireSymbols: settings.password_require_symbols || false,
    sessionTimeout: settings.session_timeout || 60,
    maxLoginAttempts: settings.max_login_attempts || 5,
  }
}

/**
 * Get email configuration
 */
export async function getEmailConfig() {
  const settings = await getSettingsAsObject("email")

  return {
    smtpHost: settings.smtp_host || "",
    smtpPort: settings.smtp_port || 587,
    smtpUsername: settings.smtp_username || "",
    smtpPassword: settings.smtp_password || "",
    smtpFromEmail: settings.smtp_from_email || "",
    smtpFromName: settings.smtp_from_name || "",
  }
}

/**
 * Get user management configuration
 */
export async function getUserConfig() {
  const settings = await getSettingsAsObject("users")

  return {
    allowRegistration: settings.allow_registration !== false,
    requireEmailVerification: settings.require_email_verification || false,
    defaultUserRole: settings.default_user_role || "User",
    maxUsers: settings.max_users || 0,
  }
}

/**
 * Get notification configuration
 */
export async function getNotificationConfig() {
  const settings = await getSettingsAsObject("notifications")

  return {
    enableEmailNotifications: settings.enable_email_notifications !== false,
    notifyAdminNewUser: settings.notify_admin_new_user !== false,
    notifyPasswordReset: settings.notify_password_reset !== false,
  }
}

/**
 * Get appearance configuration
 */
export async function getAppearanceConfig() {
  const settings = await getSettingsAsObject("appearance", true)

  return {
    themePrimaryColor: settings.theme_primary_color || "#3b82f6",
    themeSecondaryColor: settings.theme_secondary_color || "#64748b",
    enableDarkMode: settings.enable_dark_mode !== false,
    defaultTheme: settings.default_theme || "system",
  }
}

/**
 * Validate password based on security settings
 */
export async function validatePassword(password: string): Promise<{
  isValid: boolean
  errors: string[]
}> {
  const config = await getSecurityConfig()
  const errors: string[] = []

  if (password.length < config.passwordMinLength) {
    errors.push(`Password must be at least ${config.passwordMinLength} characters long`)
  }

  if (config.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }

  if (config.passwordRequireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  if (config.passwordRequireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Check if registration is allowed
 */
export async function isRegistrationAllowed(): Promise<boolean> {
  const config = await getUserConfig()

  // Check if registration is enabled
  if (!config.allowRegistration) {
    return false
  }

  // Check if max users limit is reached
  if (config.maxUsers > 0) {
    const userCount = await db.user.count()
    if (userCount >= config.maxUsers) {
      return false
    }
  }

  return true
}

/**
 * Check if application is in maintenance mode
 */
export async function isMaintenanceMode(): Promise<boolean> {
  return await getSettingValue("maintenance_mode", false)
}
