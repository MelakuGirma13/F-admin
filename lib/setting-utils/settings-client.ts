import {
    getSetting,
    getSettingValue,
    getSettingsByCategory,
    getAllSettings,
    getSettingsAsObject,
    isFeatureEnabled,
    getAppConfig,
    getSecurityConfig,
    getEmailConfig,
    getUserConfig,
    getNotificationConfig,
    getAppearanceConfig,
    validatePassword,
    isRegistrationAllowed,
    isMaintenanceMode,
  } from "./settings-utils"
  
  // Re-export all utility functions for easier imports
  export {
    getSetting,
    getSettingValue,
    getSettingsByCategory,
    getAllSettings,
    getSettingsAsObject,
    isFeatureEnabled,
    getAppConfig,
    getSecurityConfig,
    getEmailConfig,
    getUserConfig,
    getNotificationConfig,
    getAppearanceConfig,
    validatePassword,
    isRegistrationAllowed,
    isMaintenanceMode,
  }
  
  // Settings client class for more organized usage
  export class SettingsClient {
  
    async get<T = string>(key: string, defaultValue: T, publicOnly = false): Promise<T> {
      const value = await getSettingValue(key, defaultValue, publicOnly)
      return value
    }
  
    async getCategory(category: string, publicOnly = false) {
      const value = await getSettingsAsObject(category, publicOnly)
      return value
    }
  
    async isEnabled(featureKey: string, defaultValue = false): Promise<boolean> {
      return await this.get(featureKey, defaultValue)
    }
  
     // Convenience methods
    async app() {
      return await getAppConfig()
    }
  
    async security() {
      return await getSecurityConfig()
    }
  
    async email() {
      return await getEmailConfig()
    }
  
    async users() {
      return await getUserConfig()
    }
  
    async notifications() {
      return await getNotificationConfig()
    }
  
    async appearance() {
      return await getAppearanceConfig()
    }
  }
  
  // Export a default instance
  export const settings = new SettingsClient()
  