"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { ImageIcon, Upload } from "lucide-react"
import { useApp } from "@/providers/app-provider"
import { uploadImage, OcrResponse } from "@/api/media-api"
import { useToast } from "@/hooks/use-toast"

export function ImageUploader() {
  const { dispatch } = useApp()
  const { toast } = useToast()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const imageFiles = acceptedFiles.filter((file) => file.type.startsWith("image/"))

      if (imageFiles.length === 0) {
        toast({
          title: "Invalid file type",
          description: "Please upload image files (.jpg, .png, .jpeg)",
          variant: "destructive",
        })
        return
      }

      dispatch({ type: "SET_MEDIA_FILES", payload: { type: "images", files: imageFiles } })

      // Process all files in one API call
      try {
        dispatch({ type: "SET_PROCESSING", payload: true })
        // We need to adjust how progress is tracked for multiple files if needed in the future
        // For now, a single progress for the entire upload will be shown
        const results: OcrResponse = await uploadImage(imageFiles, (progress) => {
          dispatch({ type: "SET_UPLOAD_PROGRESS", payload: { type: "ocr", progress } })
        })

        // Assuming results is an object { filename: { success: boolean, text: string } }
        // We need to combine the text from all successful transcriptions
        const combinedText = Object.values(results)
          .filter(result => result.success)
          .map(result => result.text)
          .join("\n\n---\n\n"); // Join text with a separator

        dispatch({ type: "SET_TRANSCRIPTION", payload: { type: "ocr", content: combinedText } })
        
        const failedFiles = Object.entries(results)
            .filter(([filename, result]) => !result.success)
            .map(([filename, result]) => `${filename}: ${result.error || 'Unknown error'}`);

        if (failedFiles.length > 0) {
            toast({
                title: "Some images failed to process",
                description: failedFiles.join("\n"),
                variant: "destructive",
                duration: 5000 // Show for a bit longer
            });
        } else {
            toast({
                title: "Images uploaded successfully",
                description: "OCR processing completed for all images",
            });
        }

      } catch (error) {
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to process image files",
          variant: "destructive",
        })
      } finally {
        dispatch({ type: "SET_PROCESSING", payload: false })
      }
    },
    [dispatch, toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".bmp", ".tiff"],
    },
    multiple: true,
  })

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <ImageIcon className="h-4 w-4 text-primary" />
        <span className="font-medium">Images (OCR)</span>
      </div>
      <Card>
        <CardContent className="p-0">
          <div {...getRootProps()} className={`upload-zone ${isDragActive ? "dragover" : ""}`}>
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? "Drop image files here..." : "Drag & drop images or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Supports: .jpg, .png, .jpeg, .bmp, .tiff</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
