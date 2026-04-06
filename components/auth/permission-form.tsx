"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

// Define the form schema with Zod
const permissionFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .regex(/^[a-z]+:[a-z]+$/, {
      message: "Permission name must be in format 'resource:action' (e.g., users:read)",
    }),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
})

type PermissionFormValues = z.infer<typeof permissionFormSchema>

interface PermissionFormProps {
  permission?: {
    id: string
    name: string
    description?: string
  }
  onSuccess?: () => void
}

export function PermissionForm({ permission, onSuccess }: PermissionFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isEditMode = !!permission

  // Set up the form with default values
  const form = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      name: permission?.name || "",
      description: permission?.description || "",
    },
  })

  async function onSubmit(data: PermissionFormValues) {
    setIsLoading(true)

    try {
      const response = await fetch(isEditMode ? `/api/permissions/${permission.id}` : "/api/permissions", {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save permission")
      }

      toast(`Permission ${isEditMode ? "updated" : "created"} successfully`,{
        description: `${data.name} has been ${isEditMode ? "updated" : "added"} to the system.`,
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard/permissions")
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
        <CardTitle>{isEditMode ? "Edit Permission" : "Create Permission"}</CardTitle>
        <CardDescription>
          {isEditMode ? "Update permission details" : "Add a new permission to the system"}
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
                    <Input placeholder="resource:action" {...field} disabled={isEditMode} />
                  </FormControl>
                  <FormDescription>Format should be resource:action (e.g., users:read, roles:create)</FormDescription>
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
                    <Textarea placeholder="Permission description" {...field} />
                  </FormControl>
                  <FormDescription>Clearly describe what this permission allows</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update Permission" : "Create Permission"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
