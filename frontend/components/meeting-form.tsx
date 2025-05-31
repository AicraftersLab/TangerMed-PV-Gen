"use client"

import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApp } from "@/providers/app-provider"
import { useState } from "react"
import { X, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MeetingFormData {
  title: string
  date: string
  time: string
  location: string
  type: string
  googleDriveUrl?: string
}

export function MeetingForm() {
  const { state, dispatch } = useApp()
  const { toast } = useToast()
  const [participants, setParticipants] = useState<string[]>(state.meetingData.participants)
  const [newParticipant, setNewParticipant] = useState("")

  const { register, handleSubmit, setValue, watch } = useForm<MeetingFormData>({
    defaultValues: state.meetingData,
  })

  const onSubmit = (data: MeetingFormData) => {
    dispatch({
      type: "SET_MEETING_DATA",
      payload: { ...data, participants },
    })
    toast({
      title: "Meeting Details Saved",
      description: "Meeting information has been updated.",
      variant: "default",
    })
  }

  const addParticipant = () => {
    if (newParticipant.trim() && !participants.includes(newParticipant.trim())) {
      const updated = [...participants, newParticipant.trim()]
      setParticipants(updated)
      setNewParticipant("")
      dispatch({
        type: "SET_MEETING_DATA",
        payload: { participants: updated },
      })
    }
  }

  const removeParticipant = (participant: string) => {
    const updated = participants.filter((p) => p !== participant)
    setParticipants(updated)
    dispatch({
      type: "SET_MEETING_DATA",
      payload: { participants: updated },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meeting Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Meeting Title</Label>
            <Input id="title" {...register("title", { required: true })} placeholder="Enter meeting title" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date", { required: true })} />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" {...register("time", { required: true })} />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register("location")} placeholder="Meeting location" />
          </div>

          <div>
            <Label>Participants</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                placeholder="Add participant"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addParticipant())}
              />
              <Button type="button" onClick={addParticipant} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {participants.map((participant) => (
                <Badge key={participant} variant="secondary" className="flex items-center gap-1">
                  {participant}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeParticipant(participant)} />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="type">Meeting Type</Label>
            <Select onValueChange={(value) => setValue("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select meeting type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="board">Board Meeting</SelectItem>
                <SelectItem value="team">Team Meeting</SelectItem>
                <SelectItem value="client">Client Meeting</SelectItem>
                <SelectItem value="project">Project Review</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="googleDriveUrl">Google Drive URL (Optional)</Label>
            <Input id="googleDriveUrl" {...register("googleDriveUrl")} placeholder="https://drive.google.com/..." />
          </div>

          <Button type="submit" className="w-full">
            Save Meeting Details
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
