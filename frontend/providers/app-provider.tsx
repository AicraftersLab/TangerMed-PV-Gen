"use client"

import type React from "react"

import { createContext, useContext, useReducer, type ReactNode } from "react"

interface MeetingData {
  title: string
  date: string
  time: string
  location: string
  participants: string[]
  type: string
  googleDriveUrl?: string
  email: string
}

interface MediaFiles {
  video?: File[]
  audio?: File[]
  images?: File[]
  pdfs?: File[]
}

interface TranscriptionData {
  video?: string
  audio?: string
  ocr?: string
  pdf?: string
}

interface AppState {
  meetingData: MeetingData
  mediaFiles: MediaFiles
  transcriptions: TranscriptionData
  uploadProgress: Record<string, number>
  isProcessing: boolean
}

type AppAction =
  | { type: "SET_MEETING_DATA"; payload: {
      title?: string;
      date?: string;
      time?: string;
      location?: string;
      participants?: string[];
      type?: string;
      googleDriveUrl?: string;
      email?: string;
    } }
  | { type: "SET_MEDIA_FILES"; payload: { type: keyof MediaFiles; files: File[] } }
  | { type: "SET_TRANSCRIPTION"; payload: { type: keyof TranscriptionData; content: string } }
  | { type: "SET_UPLOAD_PROGRESS"; payload: { type: string; progress: number } }
  | { type: "SET_PROCESSING"; payload: boolean }
  | { type: "REMOVE_MEDIA_FILE"; payload: { type: keyof MediaFiles; file: File } }

const initialState: AppState = {
  meetingData: {
    title: "",
    date: "",
    time: "",
    location: "",
    participants: [],
    type: "",
    email: "",
    googleDriveUrl: undefined,
  },
  mediaFiles: {},
  transcriptions: {},
  uploadProgress: {},
  isProcessing: false,
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_MEETING_DATA":
      return {
        ...state,
        meetingData: { ...state.meetingData, ...action.payload },
      }
    case "SET_MEDIA_FILES":
      return {
        ...state,
        mediaFiles: { ...state.mediaFiles, [action.payload.type]: action.payload.files },
      }
    case "SET_TRANSCRIPTION":
      return {
        ...state,
        transcriptions: { ...state.transcriptions, [action.payload.type]: action.payload.content },
      }
    case "SET_UPLOAD_PROGRESS":
      return {
        ...state,
        uploadProgress: { ...state.uploadProgress, [action.payload.type]: action.payload.progress },
      }
    case "SET_PROCESSING":
      return {
        ...state,
        isProcessing: action.payload,
      }
    case "REMOVE_MEDIA_FILE":
      const filesOfType = state.mediaFiles[action.payload.type];
      if (!filesOfType) {
        return state; // No files of this type to remove
      }
      // Filter out the file to be removed
      const updatedFiles = filesOfType.filter(file => file !== action.payload.file);
      return {
        ...state,
        mediaFiles: { ...state.mediaFiles, [action.payload.type]: updatedFiles },
      };
    default:
      return state
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within AppProvider")
  }
  return context
}
