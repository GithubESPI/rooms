import axios from "axios"
import type { MeetingRoom, Meeting } from "@/lib/types"

// Create an axios instance with default config
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add a request interceptor to handle authentication
api.interceptors.request.use(
  (config) => {
    // You could add the token from localStorage or cookies here if needed
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = "/api/auth/signin"
    }
    return Promise.reject(error)
  },
)

export async function fetchMeetingRooms(): Promise<MeetingRoom[]> {
  const response = await api.get<MeetingRoom[]>("/rooms")
  return response.data
}

export async function fetchMeetings(roomId: string): Promise<Meeting[]> {
  const response = await api.get<Meeting[]>(`/rooms/${roomId}/meetings`)
  return response.data
}

export async function fetchRoomAvailability(roomId: string, date: string): Promise<boolean> {
  const response = await api.get<{ available: boolean }>(`/rooms/${roomId}/availability`, {
    params: { date },
  })
  return response.data.available
}
