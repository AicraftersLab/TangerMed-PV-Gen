import { Navbar } from "@/components/navbar"
import { TranscriptionViewer } from "@/components/transcription-viewer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TranscriptionPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transcription Management</h1>
          <p className="text-muted-foreground">Review and edit transcriptions from all media sources</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TranscriptionViewer />

          <Card>
            <CardHeader>
              <CardTitle>Transcription Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Additional transcription tools and options will be available here.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
