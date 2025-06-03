"use client"

import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { MeetingForm } from "@/components/meeting-form"
import { MediaUploader } from "@/components/media-uploader"
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

    // Moved validation logic from pv-generator.tsx
    const hasVideoFiles = state.mediaFiles.video && state.mediaFiles.video.length > 0;
    const hasAudioFiles = state.mediaFiles.audio && state.mediaFiles.audio.length > 0;
    const hasGoogleDriveUrl = !!state.meetingData.googleDriveUrl; // Ensure it's a boolean

    if (!hasVideoFiles && !hasAudioFiles && !hasGoogleDriveUrl) {
      toast({
        title: "Fichiers ou URL médias manquants",
        description: "Veuillez télécharger au moins un fichier vidéo ou audio, ou fournir une URL Google Drive.",
        variant: "destructive",
      })
      return
    }

    // If validation passes, navigate
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

        {/* Centralized layout */}
        <div className="flex flex-col items-center space-y-8 max-w-2xl mx-auto">
          <div className="w-full">
            <MeetingForm />
          </div>
          <div className="w-full">
            <MediaUploader />
          </div>
          <div className="w-full mt-8 flex justify-center">
            <Button 
              onClick={handleGeneratePV}
              size="lg"
              className="w-full max-w-md"
            >
              <FileText className="h-5 w-5 mr-2" />
              Prêt à Générer le PV
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
