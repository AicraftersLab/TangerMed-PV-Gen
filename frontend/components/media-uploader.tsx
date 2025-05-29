"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VideoUploader } from "./video-uploader"
import { AudioUploader } from "./audio-uploader"
import { ImageUploader } from "./image-uploader"
import { PDFUploader } from "./pdf-uploader"

export function MediaUploader() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <VideoUploader />
        <AudioUploader />
        <ImageUploader />
        <PDFUploader />
      </CardContent>
    </Card>
  )
}
