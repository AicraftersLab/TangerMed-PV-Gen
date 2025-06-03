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
  participants: Array<{
    nom: string
    statut: 'Present' | 'Absent Excusé' | 'Assistant'
  }>
  email: string
}

export function MeetingForm() {
  const { state, dispatch } = useApp()
  const { toast } = useToast()
  const [participants, setParticipants] = useState<Array<{nom: string, statut: 'Present' | 'Absent Excusé' | 'Assistant'}>>(
    state.meetingData.participants.map(p => typeof p === 'string' ? { nom: p, statut: 'Present' } : p)
  )
  const [newParticipant, setNewParticipant] = useState("")
  const [newParticipantStatus, setNewParticipantStatus] = useState<'Present' | 'Absent Excusé' | 'Assistant'>('Present')

  const { register, handleSubmit, setValue, watch } = useForm<MeetingFormData>({
    defaultValues: {
      ...state.meetingData,
      participants: participants
    },
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
    if (newParticipant.trim() && !participants.some(p => p.nom === newParticipant.trim())) {
      const updated = [...participants, { nom: newParticipant.trim(), statut: newParticipantStatus }]
      setParticipants(updated)
      setNewParticipant("")
      dispatch({
        type: "SET_MEETING_DATA",
        payload: { participants: updated },
      })
    }
  }

  const removeParticipant = (participant: { nom: string, statut: 'Present' | 'Absent Excusé' | 'Assistant' }) => {
    const updated = participants.filter((p) => p.nom !== participant.nom)
    setParticipants(updated)
    dispatch({
      type: "SET_MEETING_DATA",
      payload: { participants: updated },
    })
  }

  const updateParticipantStatus = (participant: { nom: string, statut: 'Present' | 'Absent Excusé' | 'Assistant' }, newStatus: 'Present' | 'Absent Excusé' | 'Assistant') => {
    const updated = participants.map(p => 
      p.nom === participant.nom ? { ...p, statut: newStatus } : p
    )
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
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              {...register("email", { 
                required: true,
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })} 
              placeholder="Enter your email address" 
            />
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
              <Select
                value={newParticipantStatus}
                onValueChange={(value: 'Present' | 'Absent Excusé' | 'Assistant') => setNewParticipantStatus(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Absent Excusé">Absent Excusé</SelectItem>
                  <SelectItem value="Assistant">Assistant</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" onClick={addParticipant} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.nom} className="flex items-center gap-2 justify-between">
                  <span className="font-medium flex-1">{participant.nom}</span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={participant.statut}
                      onValueChange={(value: 'Present' | 'Absent Excusé' | 'Assistant') => 
                        updateParticipantStatus(participant, value)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Present">Present</SelectItem>
                        <SelectItem value="Absent Excusé">Absent Excusé</SelectItem>
                        <SelectItem value="Assistant">Assistant</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => removeParticipant(participant)} className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full">
            Save Meeting Details
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
