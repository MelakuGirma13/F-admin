export interface Setting {
    id: string
    key: string
    value: string
    category: string
    type: string
    description?: string | null
    isPublic: boolean
  }
  
  export interface SettingsFormProps {
    category: string
    settings: Setting[]
  }
  
  // Define types for setting configurations
  export interface BaseSettingConfig {
    key: string;
    label: string;
    description: string;
    type: string;
    defaultValue: string;
  }
  
  export interface SelectSettingConfig extends BaseSettingConfig {
    type: 'select';
    options: { value: string; label: string }[];
  }
  
  export interface StringSettingConfig extends BaseSettingConfig {
    type: 'string' | 'textarea' | 'boolean';
  }
  
  export type SettingConfig = SelectSettingConfig | StringSettingConfig;
  
  // Define setting configurations for each category
  export const settingConfigs = {
    general: [
      {
        key: "app_name",
        label: "Application Name",
        description: "The name of your application",
        type: "string",
        defaultValue: "User Management System",
      },
      {
        key: "app_description",
        label: "Application Description",
        description: "A brief description of your application",
        type: "textarea",
        defaultValue: "A robust and scalable User Management System with RBAC",
      },
      {
        key: "app_logo_url",
        label: "Logo URL",
        description: "URL to your application logo",
        type: "string",
        defaultValue: "",
      },
      {
        key: "maintenance_mode",
        label: "Maintenance Mode",
        description: "Enable maintenance mode to prevent user access",
        type: "boolean",
        defaultValue: "false",
      },
    ],
    security: [
      {
        key: "password_min_length",
        label: "Minimum Password Length",
        description: "Minimum number of characters required for passwords",
        type: "number",
        defaultValue: "6",
      },
      {
        key: "password_require_uppercase",
        label: "Require Uppercase Letters",
        description: "Require at least one uppercase letter in passwords",
        type: "boolean",
        defaultValue: "false",
      },
      {
        key: "password_require_numbers",
        label: "Require Numbers",
        description: "Require at least one number in passwords",
        type: "boolean",
        defaultValue: "false",
      },
      {
        key: "password_require_symbols",
        label: "Require Special Characters",
        description: "Require at least one special character in passwords",
        type: "boolean",
        defaultValue: "false",
      },
      {
        key: "session_timeout",
        label: "Session Timeout (minutes)",
        description: "Automatically log out users after this many minutes of inactivity",
        type: "number",
        defaultValue: "60",
      },
      {
        key: "max_login_attempts",
        label: "Max Login Attempts",
        description: "Maximum number of failed login attempts before account lockout",
        type: "number",
        defaultValue: "5",
      },
    ],
    email: [
      {
        key: "smtp_host",
        label: "SMTP Host",
        description: "SMTP server hostname",
        type: "string",
        defaultValue: "",
      },
      {
        key: "smtp_port",
        label: "SMTP Port",
        description: "SMTP server port",
        type: "number",
        defaultValue: "587",
      },
      {
        key: "smtp_username",
        label: "SMTP Username",
        description: "SMTP authentication username",
        type: "string",
        defaultValue: "",
      },
      {
        key: "smtp_password",
        label: "SMTP Password",
        description: "SMTP authentication password",
        type: "password",
        defaultValue: "",
      },
      {
        key: "smtp_from_email",
        label: "From Email Address",
        description: "Default sender email address",
        type: "string",
        defaultValue: "",
      },
      {
        key: "smtp_from_name",
        label: "From Name",
        description: "Default sender name",
        type: "string",
        defaultValue: "",
      },
    ],
    users: [
      {
        key: "allow_registration",
        label: "Allow User Registration",
        description: "Allow new users to register accounts",
        type: "boolean",
        defaultValue: "true",
      },
      {
        key: "require_email_verification",
        label: "Require Email Verification",
        description: "Require users to verify their email address",
        type: "boolean",
        defaultValue: "false",
      },
      {
        key: "default_user_role",
        label: "Default User Role",
        description: "Default role assigned to new users",
        type: "string",
        defaultValue: "User",
      },
      {
        key: "max_users",
        label: "Maximum Users",
        description: "Maximum number of users allowed (0 for unlimited)",
        type: "number",
        defaultValue: "0",
      },
    ],
    notifications: [
      {
        key: "enable_email_notifications",
        label: "Enable Email Notifications",
        description: "Send email notifications for important events",
        type: "boolean",
        defaultValue: "true",
      },
      {
        key: "notify_admin_new_user",
        label: "Notify Admin of New Users",
        description: "Send email to admins when new users register",
        type: "boolean",
        defaultValue: "true",
      },
      {
        key: "notify_password_reset",
        label: "Password Reset Notifications",
        description: "Send email notifications for password resets",
        type: "boolean",
        defaultValue: "true",
      },
    ],
    appearance: [
      {
        key: "theme_primary_color",
        label: "Primary Color",
        description: "Primary theme color (hex code)",
        type: "string",
        defaultValue: "#3b82f6",
      },
      {
        key: "theme_secondary_color",
        label: "Secondary Color",
        description: "Secondary theme color (hex code)",
        type: "string",
        defaultValue: "#64748b",
      },
      {
        key: "enable_dark_mode",
        label: "Enable Dark Mode",
        description: "Allow users to switch to dark mode",
        type: "boolean",
        defaultValue: "true",
      },
      {
        key: "default_theme",
        label: "Default Theme",
        description: "Default theme for new users",
        type: "select",
        options: ["light", "dark", "system"],
        defaultValue: "system",
      },
    ],
  }


  //setting providers
  /*
  Global context for accessing settings throughout the app
  Automatic type conversion and caching
  Error handling and fallback to defaults
   */
  export interface AppSettings {
    appName: string
    appDescription: string
    appLogoUrl: string
    maintenanceMode: boolean
    allowRegistration: boolean
    themePrimaryColor: string
    themeSecondaryColor: string
    enableDarkMode: boolean
    defaultTheme: string
  }
  
  export interface SettingsContextType {
    settings: AppSettings
    loading: boolean
    error: string | null
    refreshSettings: () => void
  }
  
  export const defaultSettings: AppSettings = {
    appName: "User Management System",
    appDescription: "A robust and scalable User Management System with RBAC",
    appLogoUrl: "",
    maintenanceMode: false,
    allowRegistration: true,
    themePrimaryColor: "#3b82f6",
    themeSecondaryColor: "#64748b",
    enableDarkMode: true,
    defaultTheme: "system",
  }