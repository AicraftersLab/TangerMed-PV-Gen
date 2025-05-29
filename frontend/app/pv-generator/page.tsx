import { Navbar } from "@/components/navbar"
import { PVGenerator } from "@/components/pv-generator"

export default function PVGeneratorPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">PV Generator</h1>
          <p className="text-muted-foreground">Generate professional meeting minutes from your transcriptions</p>
        </div>

        <PVGenerator />
      </main>
    </div>
  )
}
