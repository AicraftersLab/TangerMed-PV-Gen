"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Upload } from "lucide-react"
import { useApp } from "@/providers/app-provider"
import { useToast } from "@/hooks/use-toast"

export function PDFUploader() {
  const { dispatch, state } = useApp()
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

      toast({
        title: "PDF files added",
        description: "PDF files are ready for PV generation.",
        variant: "default",
      });
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

          {state.mediaFiles.pdfs && state.mediaFiles.pdfs.length > 0 && (
            <div className="p-2 bg-muted/50 border-t text-sm text-muted-foreground">
              <p className="font-medium mb-1">Uploaded:</p>
              {state.mediaFiles.pdfs.map((file, index) => (
                <div key={index} className="flex items-center justify-between">
                  <p className="text-xs truncate">{file.name}</p>
                  <button 
                    onClick={() => dispatch({ type: "REMOVE_MEDIA_FILE", payload: { type: "pdfs", file: file } })}
                    className="ml-2 text-red-500 hover:text-red-700 text-xs"
                    aria-label={`Remove ${file.name}`}
                  >
                    &#x2716;
                  </button>
                </div>
              ))}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
