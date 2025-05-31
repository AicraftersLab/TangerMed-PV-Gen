"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useApp } from "@/providers/app-provider"
import { generatePV } from "@/api/media-api"
import { useToast } from "@/hooks/use-toast"
import { Download, FileText, Loader2 } from "lucide-react"

export function PVGenerator() {
  const { state } = useApp()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedFile, setGeneratedFile] = useState<Blob | null>(null)

  const handleGenerate = async () => {
    if (!state.meetingData.title) {
      toast({
        title: "Données de réunion incomplètes",
        description: "Veuillez remplir le formulaire de réunion d'abord",
        variant: "destructive",
      })
      return
    }

    if (!state.meetingData.email) {
      toast({
        title: "Email manquant",
        description: "Veuillez fournir une adresse email valide",
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

    setIsGenerating(true)
    setProgress(0)
    setGeneratedFile(null)

    try {
      // Simuler la progression (à remplacer par la vraie progression)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 1000)

      const result = await generatePV({
        meetingData: state.meetingData,
        mediaFiles: state.mediaFiles,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (result instanceof Blob) {
        setGeneratedFile(result)
        
        // Envoyer le PV par email
        const formData = new FormData()
        formData.append('to', state.meetingData.email)
        formData.append('subject', `PV de réunion - ${state.meetingData.title}`)
        formData.append('message', `Bonjour,\n\nSuite à votre utilisation de notre plateforme de génération de procès-verbaux, nous vous informons que le document a été généré avec succès.\n\nCordialement,\nL'équipe AI Crafters`)
        formData.append('isHtml', 'false')
        formData.append('attachments', result, `PV_${state.meetingData.date.replace(/\//g, '_').replace(/-/g, '_')}.docx`)

        const emailResponse = await fetch('https://y-hfsdu2g7u-hazizensa-1599s-projects.vercel.app/api/send-email', {
          method: 'POST',
          body: formData
        })

        if (!emailResponse.ok) {
          throw new Error('Failed to send email')
        }

        toast({
          title: "PV généré et envoyé",
          description: "Le PV a été généré et envoyé à votre adresse email.",
          variant: "default",
        })
      } else {
        throw new Error("Format de réponse invalide")
      }
    } catch (error) {
      toast({
        title: "Échec de la génération",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedFile) return

    const url = URL.createObjectURL(generatedFile)
    const a = document.createElement("a")
    a.href = url
    a.download = `Procès-Verbal_${state.meetingData.date.replace(/\//g, '_').replace(/-/g, '_')}.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Génération du PV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isGenerating && !generatedFile && (
          <Button 
            onClick={handleGenerate} 
            className="w-full"
            disabled={isGenerating}
          >
            Générer le PV
          </Button>
        )}

        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Génération du PV en cours...</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {generatedFile && !isGenerating && (
          <Button 
            onClick={handleDownload} 
            className="w-full"
            variant="default"
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger le PV
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
