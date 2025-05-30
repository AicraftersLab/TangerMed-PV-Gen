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

      toast({
        title: "Image files added",
        description: "Image files are ready for PV generation.",
        variant: "default",
      });
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
