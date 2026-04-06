"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

// Define the form schema with Zod
const roleFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().optional(),
  permissionIds: z.array(z.string()),
})

type RoleFormValues = z.infer<typeof roleFormSchema>

interface Permission {
  id: string
  name: string
  description?: string
   createdAt: Date;
    updatedAt: Date;
}

interface RoleFormProps {
  role?: {
    id: string
    name: string
    description?: string
    permissions: { id: string; name: string }[]
  }
  permissions: Permission[]
  onSuccess?: () => void
}

export function RoleForm({ role, permissions, onSuccess }: RoleFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isEditMode = !!role

  // Group permissions by category for better organization
  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      const category = permission.name.split(":")[0]
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(permission)
      return acc
    },
    {} as Record<string, Permission[]>,
  )

  // Set up the form with default values
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissionIds: role?.permissions.map((permission) => permission.id) || [],
    },
  })

  async function onSubmit(data: RoleFormValues) {
    setIsLoading(true)

    try {
      const response = await fetch(isEditMode ? `/api/roles/${role.id}` : "/api/roles", {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save role")
      }

      toast( `Role ${isEditMode ? "updated" : "created"} successfully`,{
        description: `${data.name} has been ${isEditMode ? "updated" : "added"} to the system.`,
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard/roles")
        router.refresh()
      }
    } catch (error) {
      toast("Error",{
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Role" : "Create Role"}</CardTitle>
        <CardDescription>
          {isEditMode
            ? "Update role information and permission assignments"
            : "Add a new role to the system and assign permissions"}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Role name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Role description" {...field} />
                  </FormControl>
                  <FormDescription>Briefly describe the purpose of this role</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="block mb-2">Permissions</FormLabel>
              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                  <div key={category} className="border rounded-md p-4">
                    <h3 className="text-sm font-medium mb-2 capitalize">{category} Permissions</h3>
                    <div className="space-y-2">
                      {categoryPermissions.map((permission) => (
                        <FormField
                          key={permission.id}
                          control={form.control}
                          name="permissionIds"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(permission.id)}
                                  onCheckedChange={(checked) => {
                                    const updatedPermissions = checked
                                      ? [...field.value, permission.id]
                                      : field.value?.filter((id) => id !== permission.id)
                                    field.onChange(updatedPermissions)
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-medium">{permission.name}</FormLabel>
                                {permission.description && (
                                  <FormDescription className="text-xs">{permission.description}</FormDescription>
                                )}
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update Role" : "Create Role"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
