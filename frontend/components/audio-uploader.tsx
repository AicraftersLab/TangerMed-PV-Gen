"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Volume2, Upload } from "lucide-react"
import { useApp } from "@/providers/app-provider"
import { useToast } from "@/hooks/use-toast"

export function AudioUploader() {
  const { dispatch, state } = useApp()
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

      toast({
        title: "Audio files added",
        description: "Audio files are ready for PV generation.",
        variant: "default",
      });
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

          {state.mediaFiles.audio && state.mediaFiles.audio.length > 0 && (
            <div className="p-2 bg-muted/50 border-t text-sm text-muted-foreground">
              <p className="font-medium mb-1">Uploaded:</p>
              {state.mediaFiles.audio.map((file, index) => (
                <div key={index} className="flex items-center justify-between">
                  <p className="text-xs truncate">{file.name}</p>
                  <button 
                    onClick={() => dispatch({ type: "REMOVE_MEDIA_FILE", payload: { type: "audio", file: file } })}
                    className="ml-2 text-red-500 hover:text-red-700 text-xs"
                    aria-label={`Remove ${file.name}`}
                  >
                    &#x2716;
                  </button>
                </div>
              ))}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
