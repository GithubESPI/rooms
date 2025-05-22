export interface MeetingRoom {
  id: string
  name: string
  location: string
  capacity: number
  features: string[]
}

export interface Meeting {
  id: string
  subject: string
  startTime: string
  endTime: string
  organizer: string
  attendeeCount: number
  roomId: string
}

export interface User {
  id: string
  name: string
  email: string
  image?: string
}

export interface Session {
  user?: User
  accessToken?: string
  error?: string
  expires?: string
}
