"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Upload } from "lucide-react"
import { useApp } from "@/providers/app-provider"
import { uploadPDF } from "@/api/media-api"
import { useToast } from "@/hooks/use-toast"

export function PDFUploader() {
  const { dispatch } = useApp()
  const { toast } = useToast()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const pdfFiles = acceptedFiles.filter((file) => file.type === "application/pdf")

      if (pdfFiles.length === 0) {
        toast({
          title: "Invalid file type",
          description: "Please upload PDF files",
          variant: "destructive",
        })
        return
      }

      dispatch({ type: "SET_MEDIA_FILES", payload: { type: "pdfs", files: pdfFiles } })

      // Process only the first PDF file, as the backend currently supports single file upload for PDF
      if (pdfFiles.length > 0) {
        const file = pdfFiles[0];
        try {
          dispatch({ type: "SET_PROCESSING", payload: true });
          const extractedData = await uploadPDF(file, (progress) => {
            dispatch({ type: "SET_UPLOAD_PROGRESS", payload: { type: "pdf", progress } });
          });

          // Assuming extractedData is { summary: string, acronyms: { [key: string]: string }, filename: string }
          dispatch({ type: "SET_TRANSCRIPTION", payload: { type: "pdf", content: extractedData.summary } }); // Pass only the summary string
          // You might also want to display acronyms somewhere
          console.log("Extracted Acronyms:", extractedData.acronyms); // Log acronyms for now

          toast({
            title: "PDF uploaded successfully",
            description: "Text extraction completed",
          });
        } catch (error) {
          toast({
            title: "Upload failed",
            description: error instanceof Error ? error.message : "Failed to extract text from PDF",
            variant: "destructive",
          });
        } finally {
          dispatch({ type: "SET_PROCESSING", payload: false });
        }
      } else {
         toast({
            title: "No valid PDF file selected",
            description: "Please select at least one PDF file to upload.",
            variant: "destructive",
          });
      }
    },
    [dispatch, toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: true,
  })

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="font-medium">PDF Documents</span>
      </div>
      <Card>
        <CardContent className="p-0">
          <div {...getRootProps()} className={`upload-zone ${isDragActive ? "dragover" : ""}`}>
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? "Drop PDF files here..." : "Drag & drop PDF files or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Supports: .pdf</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
