"use client"

import { PVGenerator } from "@/components/pv-generator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function PVGeneratorPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Génération du Procès-Verbal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PVGenerator />
        </CardContent>
      </Card>
    </div>
  )
}
