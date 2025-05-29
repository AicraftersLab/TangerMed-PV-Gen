import { useRef, useState, useCallback } from "react"

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      streamRef.current = stream
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setError(null)
      startTimer()
    } catch (err) {
      setError("Erreur d'accès au micro")
    }
  }

  const pauseRecording = () => {
    mediaRecorderRef.current?.pause()
    stopTimer()
    setIsPaused(true)
  }

  const resumeRecording = () => {
    mediaRecorderRef.current?.resume()
    startTimer()
    setIsPaused(false)
  }

  const stopRecording = (): Promise<File | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) return resolve(null)

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        const file = new File([blob], "recording.webm", { type: "audio/webm" })

        streamRef.current?.getTracks().forEach((track) => track.stop())
        setIsRecording(false)
        setIsPaused(false)
        stopTimer()
        setRecordingTime(0)
        resolve(file)
      }

      mediaRecorderRef.current.stop()
    })
  }

  return {
    isRecording,
    isPaused,
    error,
    recordingTime,
    formatTime,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  }
}
