"use client"

import { PVGenerator } from "@/components/pv-generator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { ProgressTracker } from "@/components/progress-tracker"

export default function PVGeneratorPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Génération du Procès-Verbal</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Générez votre procès-verbal en quelques clics.
          </p>
        </div>

        <div className="mb-8 max-w-2xl mx-auto w-full">
           <ProgressTracker />
        </div>

        <Card className="max-w-2xl mx-auto w-full">
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
      </main>
    </div>
  )
}
