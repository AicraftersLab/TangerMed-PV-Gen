"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useApp } from "@/providers/app-provider"
import { generatePV } from "@/api/media-api"
import { useToast } from "@/hooks/use-toast"
import { Download, FileText, Eye } from "lucide-react"

export function PVGenerator() {
  const { state } = useApp()
  const { toast } = useToast()
  const [template, setTemplate] = useState("standard")
  const [generatedPV, setGeneratedPV] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!state.meetingData.title) {
      toast({
        title: "Missing meeting data",
        description: "Please fill in the meeting form first",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const blob = await generatePV({
        meetingData: state.meetingData,
        transcriptions: state.transcriptions,
        options: { template },
      })

      // Convert blob to text for preview
      const text = await blob.text()
      setGeneratedPV(text)

      toast({
        title: "PV generated successfully",
        description: "Your meeting minutes are ready",
      })
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate meeting minutes",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExport = async (format: "docx" | "pdf") => {
    try {
      const blob = await generatePV({
        meetingData: state.meetingData,
        transcriptions: state.transcriptions,
        options: { template, format },
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${state.meetingData.title || "meeting-minutes"}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export successful",
        description: `Meeting minutes exported as ${format.toUpperCase()}`,
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export meeting minutes",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>PV Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Template</label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Available Sources:</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              {state.transcriptions.video && <div>✓ Video transcription</div>}
              {state.transcriptions.audio && <div>✓ Audio transcription</div>}
              {state.transcriptions.ocr && <div>✓ OCR text</div>}
              {state.transcriptions.pdf && <div>✓ PDF content</div>}
              {!Object.values(state.transcriptions).some(Boolean) && <div>No transcriptions available</div>}
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate PV"}
          </Button>

          {generatedPV && (
            <div className="flex gap-2">
              <Button onClick={() => handleExport("docx")} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Export DOCX
              </Button>
              <Button onClick={() => handleExport("pdf")} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={generatedPV}
            onChange={(e) => setGeneratedPV(e.target.value)}
            placeholder="Generated meeting minutes will appear here..."
            className="min-h-[400px] resize-none"
          />
        </CardContent>
      </Card>
    </div>
  )
}
