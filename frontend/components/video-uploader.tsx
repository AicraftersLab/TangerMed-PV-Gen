"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Video, Upload, Link } from "lucide-react"
import { useApp } from "@/providers/app-provider"
import { uploadVideo } from "@/api/media-api"
import { useToast } from "@/hooks/use-toast"

export function VideoUploader() {
  const { dispatch } = useApp()
  const { toast } = useToast()
  const [driveUrl, setDriveUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = useCallback(
    async (data: { file?: File, driveUrl?: string }) => {
      setIsUploading(true)
      try {
        dispatch({ type: "SET_PROCESSING", payload: true })
        dispatch({ type: "SET_TRANSCRIPTION", payload: { type: "video", content: "" } })
        dispatch({ type: "SET_UPLOAD_PROGRESS", payload: { type: "video", progress: 0 } })

        const transcription = await uploadVideo(data, (progress) => {
          dispatch({ type: "SET_UPLOAD_PROGRESS", payload: { type: "video", progress } })
        })

        dispatch({ type: "SET_TRANSCRIPTION", payload: { type: "video", content: transcription } })
        toast({
          title: data.file ? "Video uploaded successfully" : "Video processing started",
          description: data.file ? "Transcription completed" : "Processing video from Drive URL",
        })
        setDriveUrl("")
      } catch (error) {
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to process video",
          variant: "destructive",
        })
        if (data.driveUrl && data.driveUrl !== '') dispatch({ type: "SET_UPLOAD_PROGRESS", payload: { type: "video", progress: 0 } })
      } finally {
        dispatch({ type: "SET_PROCESSING", payload: false })
        setIsUploading(false)
      }
    },
    [dispatch, toast]
  )

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const videoFiles = acceptedFiles.filter((file) => file.type.startsWith("video/") || file.name.endsWith(".vro"))

      if (videoFiles.length === 0) {
        toast({
          title: "Invalid file type",
          description: "Please upload video files (.mp4, .vro)",
          variant: "destructive",
        })
        return
      }

      const file = videoFiles[0]
      dispatch({ type: "SET_MEDIA_FILES", payload: { type: "video", files: [file] } })
      handleUpload({ file })
    },
    [dispatch, toast, handleUpload]
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
    dispatch({ type: "SET_MEDIA_FILES", payload: { type: "video", files: [] } })
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
          
          <div className="p-4 border-t flex items-center gap-2">
            <Link className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Or paste Google Drive video URL here..."
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              className="flex-1"
              disabled={isUploading}
            />
            <Button onClick={handleUrlUpload} disabled={isUploading}>Upload URL</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
