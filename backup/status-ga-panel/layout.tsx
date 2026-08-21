import type React from "react"
import { Suspense } from "react"
import { AuthProvider } from "@/lib/auth-context"

export default function GAPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </AuthProvider>
  )
}
