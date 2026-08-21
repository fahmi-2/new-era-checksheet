"use client"

import { Suspense } from "react"
import PelaporanListPageContent from "./page-content"

export default function PelaporanListPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: "20px" }}>Loading...</div>}>
      <PelaporanListPageContent />
    </Suspense>
  )
}
