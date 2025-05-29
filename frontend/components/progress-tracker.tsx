"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useApp } from "@/providers/app-provider"
import { Video, Volume2, ImageIcon, FileText } from "lucide-react"

export function ProgressTracker() {
  const { state } = useApp()

  const progressItems = [
    {
      icon: Video,
      label: "Video transcription",
      progress: state.uploadProgress.video || 0,
      color: "text-blue-500",
    },
    {
      icon: Volume2,
      label: "Audio transcription",
      progress: state.uploadProgress.audio || 0,
      color: "text-green-500",
    },
    {
      icon: ImageIcon,
      label: "OCR Processing",
      progress: state.uploadProgress.ocr || 0,
      color: "text-purple-500",
    },
    {
      icon: FileText,
      label: "PDF Extraction",
      progress: state.uploadProgress.pdf || 0,
      color: "text-orange-500",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {progressItems.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className={`h-4 w-4 ${item.color}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <span className="text-sm text-muted-foreground">{item.progress}%</span>
            </div>
            <Progress value={item.progress} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
