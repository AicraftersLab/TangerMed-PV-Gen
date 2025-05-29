import { Navbar } from "@/components/navbar"
import { MeetingForm } from "@/components/meeting-form"
import { MediaUploader } from "@/components/media-uploader"
import { TranscriptionViewer } from "@/components/transcription-viewer"
import { ProgressTracker } from "@/components/progress-tracker"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Generate Meeting Minutes (PV)</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Streamline your meetings with automatic transcription and minute generation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Meeting Form */}
          <div className="lg:col-span-1">
            <MeetingForm />
          </div>

          {/* Media Upload */}
          <div className="lg:col-span-1">
            <MediaUploader />
          </div>

          {/* Progress & Transcription */}
          <div className="lg:col-span-1 space-y-6">
            <ProgressTracker />
            <TranscriptionViewer />
          </div>
        </div>
      </main>
    </div>
  )
}
