"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Video, Upload, Link } from "lucide-react"
import { useApp } from "@/providers/app-provider"
import { useToast } from "@/hooks/use-toast"

export function VideoUploader() {
  const { dispatch, state } = useApp()
  const { toast } = useToast()
  const [driveUrl, setDriveUrl] = useState("")

  const handleUpload = useCallback(
    async (data: { file?: File, driveUrl?: string }) => {
      try {
        if (data.file) {
          dispatch({ type: "SET_MEDIA_FILES", payload: { type: "video", files: [data.file] } })
        } else if (data.driveUrl) {
          dispatch({ type: "SET_MEETING_DATA", payload: { googleDriveUrl: data.driveUrl } })
          setDriveUrl("")
          toast({
            title: "URL ajoutée",
            description: "L'URL Google Drive a été enregistrée pour traitement.",
            variant: "default",
          })
        }
      } catch (error) {
        toast({
          title: "Processing setup failed",
          description: error instanceof Error ? error.message : "Failed to prepare video for processing",
          variant: "destructive",
        })
      }
    },
    [dispatch, toast]
  )

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        toast({
          title: "Invalid file type",
          description: "Please upload video files (.mp4, .vro)",
          variant: "destructive",
        })
        return
      }

      const file = acceptedFiles[0]
      handleUpload({ file })
    },
    [toast, handleUpload]
  )

  const handleUrlUpload = async () => {
    if (!driveUrl.trim()) {
      toast({
        title: "Empty URL",
        description: "Please enter a Google Drive URL.",
        variant: "destructive",
      })
      return
    }
    handleUpload({ driveUrl })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".avi", ".mov", ".mkv"],
      "application/octet-stream": [".vro"],
    },
    multiple: false,
  })

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Video className="h-4 w-4 text-primary" />
        <span className="font-medium">Video</span>
      </div>
      <Card>
        <CardContent className="p-0">
          <div {...getRootProps()} className={`upload-zone ${isDragActive ? "dragover" : ""}`}>
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? "Drop video files here..." : "Drag & drop video files or"}
            </p>
            <p className="text-sm text-muted-foreground"> click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Supports: .mp4, .vro, .avi, .mov, .mkv</p>
          </div>

          {state.mediaFiles.video && state.mediaFiles.video.length > 0 && (
            <div className="p-2 bg-muted/50 border-t text-sm text-muted-foreground">
              <p className="font-medium mb-1">Uploaded:</p>
              {state.mediaFiles.video.map((file, index) => (
                <div key={index} className="flex items-center justify-between">
                  <p key={index} className="text-xs truncate">{file.name}</p>
                  <button 
                    onClick={() => dispatch({ type: "REMOVE_MEDIA_FILE", payload: { type: "video", file: file } })}
                    className="ml-2 text-red-500 hover:text-red-700 text-xs"
                    aria-label={`Remove ${file.name}`}
                  >
                    &#x2716;
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 border-t flex items-center gap-2">
            <Link className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Or paste Google Drive video URL here..."
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleUrlUpload}>Upload URL</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
