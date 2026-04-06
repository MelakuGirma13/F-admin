"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {  z } from "zod"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

import { Loader2, Save } from "lucide-react"
import { settingConfigs, SettingsFormProps } from "./setting-types"


export const SettingsForm = ({ category, settings }: SettingsFormProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const categoryConfig = settingConfigs[category as keyof typeof settingConfigs] || []

  // Create form schema dynamically based on category
  const createFormSchema = () => {
    const schemaFields: Record<string, z.ZodTypeAny> = {}

    categoryConfig.forEach((config) => {
      switch (config.type) {
        case "number":
          schemaFields[config.key] = z.coerce.number().min(0)
          break
        case "boolean":
          schemaFields[config.key] = z.boolean()
          break
        case "email":
          schemaFields[config.key] = z.string().email().optional().or(z.literal(""))
          break
        default:
          schemaFields[config.key] = z.string()
      }
    })

    return z.object(schemaFields)
  }

  const formSchema = createFormSchema()
  type FormValues = z.infer<typeof formSchema>

  // Create default values from existing settings or config defaults
  const createDefaultValues = (): FormValues => {
    const defaults: Record<string, any> = {}

    categoryConfig.forEach((config) => {
      const existingSetting = settings.find((s) => s.key === config.key)
      let value: string | number | boolean = existingSetting?.value || config.defaultValue

      // Convert value based on type
      if (config.type === "boolean") {
        value = String(value).toLowerCase() === "true"
      } else if (config.type === "number") {
        value = Number(value) || 0
      }

      defaults[config.key] = value
    })

    return defaults as FormValues
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: createDefaultValues(),
  })

  async function onSubmit(data: FormValues) {
    setIsLoading(true)

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          settings: Object.entries(data).map(([key, value]) => ({
            key,
            value: String(value),
            category,
            type: categoryConfig.find((c) => c.key === key)?.type || "string",
            description: categoryConfig.find((c) => c.key === key)?.description,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save settings")
      }

      console.log('Toast triggered');
      toast("Settings saved successfully",{
        description: `${category.charAt(0).toUpperCase() + category.slice(1)} settings have been updated.`,
      })
      

      router.refresh()
    } catch (error) {
      toast("Error",{
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryTitle = (cat: string) => {
    const titles: Record<string, string> = {
      general: "General Settings",
      security: "Security Settings",
      email: "Email Configuration",
      users: "User Management",
      notifications: "Notification Settings",
      appearance: "Appearance Settings",
    }
    return titles[cat] || "Settings"
  }

  const getCategoryDescription = (cat: string) => {
    const descriptions: Record<string, string> = {
      general: "Configure basic application settings",
      security: "Manage security policies and authentication settings",
      email: "Configure SMTP settings for email delivery",
      users: "Control user registration and default settings",
      notifications: "Manage system notification preferences",
      appearance: "Customize the look and feel of the application",
    }
    return descriptions[cat] || "Configure settings"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getCategoryTitle(category)}</CardTitle>
        <CardDescription>{getCategoryDescription(category)}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {categoryConfig.map((config) => (
              <FormField
                key={config.key}
                control={form.control}
                name={config.key}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{config.label}</FormLabel>
                    <FormControl>
                      {config.type === "textarea" ? (
                        <Textarea placeholder={config.label} {...field} />
                      ) : config.type === "boolean" ? (
                        <div className="flex items-center space-x-2">
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                          <span className="text-sm">{field.value ? "Enabled" : "Disabled"}</span>
                        </div>
                      ) : config.type === "select" && 'options' in config && config.options ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${config.label.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {config.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : config.type === "password" ? (
                        <Input type="password" placeholder={config.label} {...field} />
                      ) : (
                        <Input
                          type={config.type === "number" ? "number" : config.type === "email" ? "email" : "text"}
                          placeholder={config.label}
                          {...field}
                        />
                      )}
                    </FormControl>
                    {config.description && <FormDescription>{config.description}</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
