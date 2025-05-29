"use client"

import { useState } from "react"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import { Button } from "@/components/ui/button"
import { Mic, Pause, Play, Square } from "lucide-react"
import { uploadAudio } from "@/api/media-api"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/providers/app-provider"

export default function AudioRecorder() {
  const {
    isRecording,
    isPaused,
    recordingTime,
    formatTime,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    error,
  } = useAudioRecorder()

  const { toast } = useToast()
  const { dispatch } = useApp()
  const [isUploading, setIsUploading] = useState(false)

  const handleStop = async () => {
    const file = await stopRecording()
    if (!file) return

    try {
      setIsUploading(true)
      dispatch({ type: "SET_PROCESSING", payload: true })

      const transcription = await uploadAudio(file, (progress) => {
        dispatch({ type: "SET_UPLOAD_PROGRESS", payload: { type: "audio", progress } })
      })

      dispatch({ type: "SET_TRANSCRIPTION", payload: { type: "audio", content: transcription } })

      toast({
        title: "Transcription réussie",
        description: "L'enregistrement a été analysé avec succès.",
      })
    } catch (e) {
      toast({
        title: "Erreur",
        description: "Échec de la transcription.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      dispatch({ type: "SET_PROCESSING", payload: false })
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-xl shadow-md bg-gray-900 text-gray-200">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Mic className="text-primary" />
        Enregistrement vocal
      </div>

      <div className="text-center text-3xl font-mono text-primary">
        {formatTime(recordingTime)}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-center gap-4">
        {!isRecording ? (
          <Button onClick={startRecording} disabled={isUploading}>
            <Mic className="mr-2 h-4 w-4" />
            Démarrer
          </Button>
        ) : (
          <>
            <Button onClick={isPaused ? resumeRecording : pauseRecording} variant="secondary">
              {isPaused ? (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Reprendre
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </>
              )}
            </Button>

            <Button onClick={handleStop} variant="destructive">
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
