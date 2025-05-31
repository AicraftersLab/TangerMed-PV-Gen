"use client"

import { useState } from "react"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import { Button } from "@/components/ui/button"
import { Mic, Pause, Play, Square } from "lucide-react"
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

  const handleStop = async () => {
    const file = await stopRecording()
    if (!file) {
       toast({
          title: "Recording failed",
          description: "Could not get audio file from recording.",
          variant: "destructive",
        });
      return;
    }

    dispatch({ type: "SET_MEDIA_FILES", payload: { type: "audio", files: [file] } });

    toast({
      title: "Recording saved",
      description: "Audio recording is ready for PV generation.",
      variant: "default",
    });
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
          <Button onClick={startRecording}>
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
