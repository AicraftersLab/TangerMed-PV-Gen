# TangerMed-pv-Gen

This project is a web application designed to automate the generation of meeting minutes (Procès-Verbal - PV) by processing various media inputs including videos, audio files, handwritten notes (via OCR), and PDF documents.

## Features

*   **Emailing of Generated PV:** Automatically send the generated meeting minutes as an email attachment.
*   **Video Transcription:** Transcribe spoken content from video files.
*   **Audio Transcription:** Transcribe spoken content from audio files.
*   **OCR for Handwritten Notes:** Extract text from images containing handwritten notes.
*   **PDF Extraction:** Extract detailed content and identify acronyms from PDF documents.
*   **Meeting Minutes (PV) Generation:** Compile information from transcribed and extracted content to generate a structured PV.

## Technologies Used

### Backend (FastAPI Python API)

*   **Framework:** FastAPI
*   **Language:** Python
*   **AI/ML:** Google Generative AI (Gemini API) for transcription, OCR, and PDF analysis
*   **Media Processing:** ffmpeg, ffprobe (via subprocess calls)
*   **File Handling:** `tempfile` for temporary storage
*   **HTTP Requests:** `requests`
*   **Environment Management:** `python-dotenv`
*   **Web Server:** Uvicorn
*   **Dependency Management:** `pip`

### Backend (Vercel Email API)

*   **Framework:** Express.js
*   **Language:** JavaScript/Node.js
*   **Email Sending:** Nodemailer
*   **Multipart Form Data Handling:** Multer

### Frontend

*   **Framework:** Next.js
*   **Language:** TypeScript
*   **UI Library:** Shadcn UI (built on Radix UI and Tailwind CSS)
*   **Styling:** Tailwind CSS
*   **File Upload:** React Dropzone
*   **Icons:** Lucide React
*   **State Management:** Custom Context/Reducer (based on `useApp` and `dispatch`)
*   **API Interaction:** Custom functions using `XMLHttpRequest` and `fetch`

## Installation

### Prerequisites

*   Python 10
*   Node.js and npm or yarn
*   ffmpeg and ffprobe installed and available in your system's PATH. You can download them from [ffmpeg.org](https://ffmpeg.org/download.html).

### Cloning the Repository

```bash
git clone https://github.com/HafsaAziz/TangerMed-PV-Gen.git 
cd TangerMed-pv-Gen
```

### Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt # Assuming you have a requirements.txt, if not generate one or install manually: fastapi uvicorn python-dotenv google-generativeai requests
    ```
3.  Create a `.env` file in the `backend` directory and add your Google API Key:
    ```env
    GOOGLE_API_KEY="YOUR_GEMINI_API_KEY"
    ```
    Replace `"YOUR_GEMINI_API_KEY"` with your actual API key obtained from the Google AI for Developers website.
4.  Ensure `ffmpeg` and `ffprobe` are installed and accessible from your terminal.

### Frontend Setup

1.  Navigate to the `frontend` directory from the project root:
    ```bash
    cd frontend
    ```
2.  Install Node.js dependencies:
    ```bash
    npm install # or yarn install
    ```

## Running the Project

1.  **Start the Backend Server:**
    Open a terminal, navigate to the `backend` directory, and run:
    ```bash
    python run app.py
    ```
    The `--reload` flag will restart the server automatically on code changes.
2.  **Start the Frontend Server:**
    Open a *new* terminal, navigate to the `frontend` directory, and run:
    ```bash
    npm run dev # or yarn dev
    ```
    The frontend server will typically run on `http://localhost:3000` (or another available port).

Open your web browser and go to the frontend address (e.g., `http://localhost:3000`) to use the application.

## Backend Documentation (backend/app.py)

The backend is built with FastAPI and exposes several endpoints for media processing and PV generation. Files uploaded are processed using **temporary directories** and are not stored persistently.

*   **`/transcribe_video` (POST)**
    *   **Description:** Transcribes the audio content of a video file.
    *   **Input:** `multipart/form-data`
        *   `video`: (Optional) Video file (`UploadFile`).
        *   `drive_url`: (Optional) Google Drive sharing URL (string).
        *   *Note: Either `video` or `drive_url` must be provided.*
    *   **Processing:** Downloads video (if URL), verifies file, extracts audio (MP3), segments audio, transcribes each segment using Gemini (`gemini-2.0-flash`).
    *   **Output:** `application/json`
        *   `transcript`: The full transcribed text (string).

*   **`/transcribe_audio` (POST)**
    *   **Description:** Transcribes audio from an uploaded audio file.
    *   **Input:** `multipart/form-data`
        *   `audio`: Audio file (`UploadFile`).
    *   **Processing:** (Placeholder - implementation needed)
    *   **Output:** `application/json`
        *   `transcript`: The transcribed text (string - currently placeholder).

*   **`/ocr_handwritten` (POST)**
    *   **Description:** Performs Optical Character Recognition (OCR) on one or more uploaded image files to extract handwritten text.
    *   **Input:** `multipart/form-data`
        *   `images`: A list of image files (`List[UploadFile]`).
    *   **Processing:** Reads image bytes, processes each image using Gemini (`gemini-2.0-flash`) for text extraction.
    *   **Output:** `application/json`
        *   `results`: An object where keys are filenames and values are `{ success: boolean, text: string, error?: string }`.

*   **`/extract_pdf` (POST)**
    *   **Description:** Extracts detailed content and identifies acronyms from an uploaded PDF document.
    *   **Input:** `multipart/form-data`
        *   `pdf`: PDF file (`UploadFile`).
    *   **Processing:** Reads PDF bytes, analyzes content and extracts acronyms using Gemini (`gemini-2.0-flash`). Attempts to find a specific separator (`--- ACRONYMES ---`) in the Gemini output to distinguish summary and acronyms. If the separator is not found, the entire text content is returned as the summary.
    *   **Output:** `application/json`
        *   `summary`: The extracted text content of the PDF (string).
        *   `acronyms`: An object where keys are acronyms and values are their definitions (object).
        *   `filename`: The name of the uploaded PDF file (string).

*   **`/generate_pv` (POST)**
    *   **Description:** Generates meeting minutes (PV) based on the provided data. The generated PV is then sent as an email attachment.
    *   **Input:** `application/json`
        *   `meetingData`: An object containing meeting details including `title`, `date`, `location`, and `email`.
        *   `mediaFiles`: An object containing arrays of `File` objects for `video`, `audio`, `images`, and `pdfs`.
    *   **Processing:** Uses Gemini to process uploaded media and generate the PV content. The generated content is then formatted into a `.docx` file and sent via the Vercel email API.
    *   **Output:** Returns a success or error status for the generation and email sending process.

## Vercel Email API Documentation (/api/send-email)

This API endpoint handles sending emails with attachments.

*   **`/api/send-email` (POST)**
    *   **Description:** Sends an email with the generated PV as an attachment.
    *   **Input:** `multipart/form-data`
        *   `to`: Recipient email address (string).
        *   `subject`: Email subject (string).
        *   `message`: Email body text (string).
        *   `isHtml`: Boolean string indicating if the message is HTML ('true' or 'false').
        *   `attachments`: The PV file as a Blob.
    *   **Processing:** Uses Nodemailer to send the email with the provided details and attachment. Requires `GMAIL_USER` and `GMAIL_PASS` environment variables to be configured.
    *   **Output:** JSON indicating success or failure.

## Frontend Documentation

The frontend is a Next.js application using TypeScript, Tailwind CSS, and Shadcn UI components. It interacts with the backend API to upload media and initiate PV generation and emailing.

*   **Framework:** Next.js (App Router)
*   **UI Components:** Located in `components/ui/` (from Shadcn UI) and `components/` (custom components).
*   **API Calls:** Handled in `api/media-api.ts` and direct `fetch` calls for the email API. This file contains functions for interacting with the backend endpoints (`generatePV`). It manages FormData creation and fetch for responses.
*   **State Management:** Application state (including uploaded files, processing status, and meeting data) is managed using a custom provider (`providers/app-provider.tsx`) and accessed via the `useApp` hook. Actions are dispatched to update the state.
*   **Key Components:**
    *   `components/video-uploader.tsx`: Handles video file drag-and-drop. Displays uploaded file name.
    *   `components/audio-uploader.tsx`: Handles audio file drag-and-drop upload. Displays uploaded file name.
    *   `components/image-uploader.tsx`: Handles image file drag-and-drop upload (supports multiple files). Displays uploaded file names.
    *   `components/pdf-uploader.tsx`: Handles PDF file drag-and-drop upload (supports multiple files). Displays uploaded file names.
    *   `components/progress-tracker.tsx`: Displays the count of uploaded files for each media type.
    *   `components/meeting-form.tsx`: Component for entering meeting details (title, date, location, email).
    *   `components/pv-generator.tsx`: Component for initiating PV generation and the email sending process.
*   **Routing:** Handled by Next.js App Router (`app/` directory). The main page is `app/page.tsx`, and the PV generation display is in `app/pv-generator/page.tsx`.
*   **Styling:** Global styles in `app/globals.css`, component styling using Tailwind CSS utility classes.

