"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useApp } from "@/providers/app-provider"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function TranscriptionViewer() {
  const { state, dispatch } = useApp()
  const { toast } = useToast()
  const [editedTranscriptions, setEditedTranscriptions] = useState({
    video: state.transcriptions.video || "",
    audio: state.transcriptions.audio || "",
    ocr: state.transcriptions.ocr || "",
    pdf: state.transcriptions.pdf || "",
  })

  useEffect(() => {
    console.log("Transcription state updated:", state.transcriptions);
    setEditedTranscriptions({
      video: state.transcriptions.video || "",
      audio: state.transcriptions.audio || "",
      ocr: state.transcriptions.ocr || "",
      pdf: state.transcriptions.pdf || "",
    })
  }, [state.transcriptions])

  const handleSave = (type: keyof typeof editedTranscriptions) => {
    dispatch({
      type: "SET_TRANSCRIPTION",
      payload: { type, content: editedTranscriptions[type] },
    })
    toast({
      title: "Transcription saved",
      description: `${type} transcription has been updated`,
    })
  }

  const transcriptionSections = [
    { key: "video" as const, label: "Video transcription", placeholder: "Video transcription will appear here..." },
    { key: "audio" as const, label: "Audio transcription", placeholder: "Audio transcription will appear here..." },
    { key: "ocr" as const, label: "OCR Text", placeholder: "OCR extracted text will appear here..." },
    { key: "pdf" as const, label: "PDF Content", placeholder: "PDF extracted content will appear here..." },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transcriptionSections.map((section) => (
          <div key={section.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{section.label}</label>
              {editedTranscriptions[section.key] && (
                <Button size="sm" variant="outline" onClick={() => handleSave(section.key)}>
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
              )}
            </div>
            <Textarea
              value={editedTranscriptions[section.key]}
              onChange={(e) =>
                setEditedTranscriptions((prev) => ({
                  ...prev,
                  [section.key]: e.target.value,
                }))
              }
              placeholder={section.placeholder}
              className="min-h-[100px] resize-none"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
