"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Volume2, Upload } from "lucide-react"
import { useApp } from "@/providers/app-provider"
import { uploadAudio } from "@/api/media-api"
import { useToast } from "@/hooks/use-toast"

export function AudioUploader() {
  const { dispatch } = useApp()
  const { toast } = useToast()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const audioFiles = acceptedFiles.filter((file) => file.type.startsWith("audio/"))

      if (audioFiles.length === 0) {
        toast({
          title: "Invalid file type",
          description: "Please upload audio files (.wav, .mp3, .m4a)",
          variant: "destructive",
        })
        return
      }

      dispatch({ type: "SET_MEDIA_FILES", payload: { type: "audio", files: audioFiles } })

      for (const file of audioFiles) {
        try {
          dispatch({ type: "SET_PROCESSING", payload: true })
          const transcription = await uploadAudio(file, (progress) => {
            dispatch({ type: "SET_UPLOAD_PROGRESS", payload: { type: "audio", progress } })
          })

          dispatch({ type: "SET_TRANSCRIPTION", payload: { type: "audio", content: transcription } })
          toast({
            title: "Audio uploaded successfully",
            description: "Transcription completed",
          })
        } catch (error) {
          toast({
            title: "Upload failed",
            description: "Failed to upload audio file",
            variant: "destructive",
          })
        } finally {
          dispatch({ type: "SET_PROCESSING", payload: false })
        }
      }
    },
    [dispatch, toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".wav", ".mp3", ".m4a", ".aac", ".flac"],
    },
    multiple: true,
  })

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Volume2 className="h-4 w-4 text-primary" />
        <span className="font-medium">Audio</span>
      </div>
      <Card>
        <CardContent className="p-0">
          <div {...getRootProps()} className={`upload-zone ${isDragActive ? "dragover" : ""}`}>
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? "Drop audio files here..." : "Drag & drop audio files or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Supports: .wav, .mp3, .m4a, .aac, .flac</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
