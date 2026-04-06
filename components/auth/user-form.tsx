"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

// Define the form schema with Zod
const userFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).optional().or(z.literal("")),
  roleIds: z.array(z.string()).min(1, { message: "Please select at least one role" }),
})

type UserFormValues = z.infer<typeof userFormSchema>

interface Role {
  id: string
  name: string
  description?: string
}

interface UserFormProps {
  user?: {
    id: string
    name?: string
    email: string
    roles: { id: string; name: string }[]
  }
  roles: Role[]
  onSuccess?: () => void
}

export function UserForm({ user, roles, onSuccess }: UserFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isEditMode = !!user

  // Set up the form with default values
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      roleIds: user?.roles.map((role) => role.id) || [],
    },
  })

  async function onSubmit(data: UserFormValues) {
    setIsLoading(true)

    try {
      // If password is empty in edit mode, remove it from the payload
      if (isEditMode && !data.password) {
        delete data.password
      }

      const response = await fetch(isEditMode ? `/api/users/${user.id}` : "/api/users", {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save user")
      }

      toast(`User ${isEditMode ? "updated" : "created"} successfully`,{
        description: `${data.name} has been ${isEditMode ? "updated" : "added"} to the system.`,
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard/users")
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
        <CardTitle>{isEditMode ? "Edit User" : "Create User"}</CardTitle>
        <CardDescription>
          {isEditMode
            ? "Update user information and role assignments"
            : "Add a new user to the system and assign roles"}
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
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEditMode ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    {isEditMode ? "Leave blank to keep the current password" : "Password must be at least 6 characters"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="block mb-2">Roles</FormLabel>
              <div className="space-y-2 border rounded-md p-4">
                {roles.map((role) => (
                  <FormField
                    key={role.id}
                    control={form.control}
                    name="roleIds"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(role.id)}
                            onCheckedChange={(checked) => {
                              const updatedRoles = checked
                                ? [...field.value, role.id]
                                : field.value?.filter((id) => id !== role.id)
                              field.onChange(updatedRoles)
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium">{role.name}</FormLabel>
                          {role.description && (
                            <FormDescription className="text-xs">{role.description}</FormDescription>
                          )}
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
                <FormMessage>{form.formState.errors.roleIds?.message}</FormMessage>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update User" : "Create User"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
