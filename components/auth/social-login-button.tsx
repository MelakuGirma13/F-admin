"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { Loader2 } from "lucide-react"

interface SocialLoginButtonProps {
  provider: string
  icon: React.ReactNode
  label: string
  className?: string
}

export function SocialLoginButton({ provider, icon, label, className }: SocialLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      await signIn(provider, { callbackUrl: "/dashboard" })
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
    }
  }

  return (
    <Button type="button" variant="outline" className={className} onClick={handleSignIn} disabled={isLoading}>
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="mr-2">{icon}</span>}
      {label}
    </Button>
  )
}
