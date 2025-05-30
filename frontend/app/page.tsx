"use client"

import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { MeetingForm } from "@/components/meeting-form"
import { MediaUploader } from "@/components/media-uploader"
import { ProgressTracker } from "@/components/progress-tracker"
import { TranscriptionViewer } from "@/components/transcription-viewer"
import { Button } from "@/components/ui/button"
import { useApp } from "@/providers/app-provider"
import { useToast } from "@/hooks/use-toast"
import { FileText } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { state } = useApp()
  const { toast } = useToast()

  const handleGeneratePV = () => {
    if (!state.meetingData.title) {
      toast({
        title: "Données de réunion incomplètes",
        description: "Veuillez remplir le formulaire de réunion d'abord",
        variant: "destructive",
      })
      return
    }

    if ((!state.mediaFiles.video || state.mediaFiles.video.length === 0) && 
        (!state.mediaFiles.audio || state.mediaFiles.audio.length === 0)) {
      toast({
        title: "Fichiers médias manquants",
        description: "Veuillez télécharger au moins un fichier vidéo ou audio",
        variant: "destructive",
      })
      return
    }

    router.push("/pv-generator")
  }

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <MeetingForm />
            <MediaUploader />
          </div>
          <div className="space-y-8">
            <ProgressTracker />
            <TranscriptionViewer />
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button 
            onClick={handleGeneratePV}
            size="lg"
            className="w-full max-w-md"
          >
            <FileText className="h-5 w-5 mr-2" />
            Générer le PV
          </Button>
        </div>
      </main>
    </div>
  )
}
