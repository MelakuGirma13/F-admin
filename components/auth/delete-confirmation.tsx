"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface DeleteConfirmationProps {
  id: string
  name: string
  type: "user" | "role" | "permission"
  onSuccess?: () => void
}

export function DeleteConfirmation({ id, name, type, onSuccess }: DeleteConfirmationProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/${type}s/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to delete ${type}`)
      }

      toast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,{
        description: `${name} has been removed from the system.`,
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/dashboard/${type}s`)
        router.refresh()
      }
    } catch (error) {
      toast("Error",{
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setIsOpen(true)}>
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this {type}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{name}</strong>
              {type === "user" && " and remove all their role assignments."}
              {type === "role" && " and remove it from all users and permissions."}
              {type === "permission" && " and remove it from all roles."}
              <br />
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
