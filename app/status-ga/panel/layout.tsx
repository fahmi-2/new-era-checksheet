// app/status-ga/panel/layout.tsx
import type React from "react"
import { Suspense } from "react"

export default function GAPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
  )
}
