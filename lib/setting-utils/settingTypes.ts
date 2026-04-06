
export interface AppConfig {
  appName: string
  appDescription: string
  appLogoUrl: string
}

export interface SecurityConfig {
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSymbols: boolean
  sessionTimeout: number
  maxLoginAttempts: number
}

export interface EmailConfig {
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  smtpFromEmail: string
  smtpFromName: string
}

export interface UserConfig {
  allowRegistration: boolean
  requireEmailVerification: boolean
  defaultUserRole: string
  maxUsers: number
}

export interface NotificationConfig {
  enableEmailNotifications: boolean
  notifyAdminNewUser: boolean
  notifyPasswordReset: boolean
}

export interface AppearanceConfig {
  themePrimaryColor: string
  themeSecondaryColor: string
  enableDarkMode: boolean
  defaultTheme: string
}
