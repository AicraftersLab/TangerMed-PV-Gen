const API_BASE_URL =  "http://localhost:8000"

export interface OcrResult {
  success: boolean;
  text: string;
  error?: string;
}

export interface OcrResponse {
  results: { [key: string]: OcrResult };
}

export async function generatePV(data: {
  meetingData: {
    title: string;
    date: string;
    time: string;
    location: string;
    participants: string[];
    type: string;
    googleDriveUrl?: string;
  };
  mediaFiles: {
    video?: File[];
    audio?: File[];
    images?: File[];
    pdfs?: File[];
  };
}): Promise<Blob | { pv: string }> {
  const formData = new FormData();

  formData.append('meetingData', JSON.stringify(data.meetingData));

  if (data.mediaFiles.video) {
    data.mediaFiles.video.forEach(file => {
        formData.append('video', file);
    });
  }
  if (data.mediaFiles.audio) {
    data.mediaFiles.audio.forEach(file => {
        formData.append('audio', file);
    });
  }
  if (data.mediaFiles.images) {
    data.mediaFiles.images.forEach(file => {
        formData.append('images', file);
    });
  }
  if (data.mediaFiles.pdfs) {
     data.mediaFiles.pdfs.forEach(file => {
        formData.append('pdfs', file);
    });
  }

  const response = await fetch(`${API_BASE_URL}/generate_pv`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to generate PV: ${response.status} ${response.statusText}`;
    try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
            errorMessage = `Failed to generate PV: ${errorJson.message}`;
        }
    } catch (e) {
        errorMessage = `Failed to generate PV: ${response.status} ${response.statusText} - ${errorText}`;
    }
    throw new Error(errorMessage);
  }

  // Check if the response is a Blob (Word document)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
    return await response.blob();
  } else {
    // Fallback for potential JSON response (though backend currently returns Blob)
    const result = await response.json();
    if (result && typeof result.pv === 'string') {
        return result as { pv: string };
    } else {
        throw new Error("Invalid response format from PV generation endpoint");
    }
  }
}
