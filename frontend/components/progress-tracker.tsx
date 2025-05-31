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
      label: "Video Files",
      count: state.mediaFiles.video?.length || 0,
      color: "text-blue-500",
    },
    {
      icon: Volume2,
      label: "Audio Files",
      count: state.mediaFiles.audio?.length || 0,
      color: "text-green-500",
    },
    {
      icon: ImageIcon,
      label: "Image Files",
      count: state.mediaFiles.images?.length || 0,
      color: "text-purple-500",
    },
    {
      icon: FileText,
      label: "PDF Files",
      count: state.mediaFiles.pdfs?.length || 0,
      color: "text-orange-500",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uploaded Files</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {progressItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <span className="text-sm text-muted-foreground">{item.count} file(s) uploaded</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
