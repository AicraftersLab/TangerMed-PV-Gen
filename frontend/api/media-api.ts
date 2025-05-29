const API_BASE_URL =  "http://localhost:8000"

export interface OcrResult {
  success: boolean;
  text: string;
  error?: string;
}

export interface OcrResponse {
  results: { [key: string]: OcrResult };
}

export async function uploadVideo(data: { file?: File, driveUrl?: string }, onProgress?: (progress: number) => void): Promise<string> {
  const formData = new FormData()

  if (data.file) {
    formData.append("video", data.file);
  } else if (data.driveUrl) {
    formData.append("drive_url", data.driveUrl);
  } else {
    return Promise.reject(new Error("No file or drive URL provided"));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress && data.file) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    if (data.driveUrl && onProgress) {
         onProgress(5);
    }

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response.transcript)
        } catch (error) {
          reject(new Error("Invalid response format"))
        } finally {
             if (data.driveUrl && onProgress) onProgress(100);
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          reject(new Error(errorResponse.error || "Upload failed"))
        } catch {
          reject(new Error("Upload failed"))
        }
         if (data.driveUrl && onProgress) onProgress(0);
      }
    })

    xhr.addEventListener("error", () => {
      reject(new Error("Network error"))
       if (data.driveUrl && onProgress) onProgress(0);
    })

    xhr.open("POST", `${API_BASE_URL}/transcribe_video`)
    xhr.send(formData)
  })
}

export async function uploadAudio(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText)
        resolve(response.transcription)
      } else {
        reject(new Error("Upload failed"))
      }
    })

    xhr.addEventListener("error", () => {
      reject(new Error("Network error"))
    })

    xhr.open("POST", `${API_BASE_URL}/transcribe_audio`)
    xhr.send(formData)
  })
}

export async function uploadImage(files: File[], onProgress?: (progress: number) => void): Promise<OcrResponse> {
  const formData = new FormData()
  for (const file of files) {
    formData.append("images", file)
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response.results)
        } catch (error) {
          reject(new Error("Invalid response format from backend"))
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          reject(new Error(errorResponse.error || "OCR processing failed"))
        } catch {
          reject(new Error("OCR processing failed"))
        }
      }
    })

    xhr.addEventListener("error", () => {
      reject(new Error("Network error"))
    })

    xhr.open("POST", `${API_BASE_URL}/ocr_handwritten`)
    xhr.send(formData)
  })
}

export async function uploadPDF(file: File, onProgress?: (progress: number) => void): Promise<{ summary: string, acronyms: { [key: string]: string }, filename: string }> {
  const formData = new FormData()
  formData.append("pdf", file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          if (response && typeof response.summary === 'string' && typeof response.acronyms === 'object') {
            resolve(response)
          } else {
            reject(new Error("Invalid response format from backend"))
          }
        } catch (error) {
          reject(new Error("Failed to parse JSON response"))
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          reject(new Error(errorResponse.error || "PDF extraction failed"))
        } catch {
          reject(new Error("PDF extraction failed"))
        }
      }
    })

    xhr.addEventListener("error", () => {
      reject(new Error("Network error"))
    })

    xhr.open("POST", `${API_BASE_URL}/extract_pdf`)
    xhr.send(formData)
  })
}

export async function generatePV(data: {
  meetingData: any
  transcriptions: any
  options?: any
}): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/generate_pv`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error("Failed to generate PV")
  }

  return response.blob()
}
