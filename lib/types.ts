export interface MeetingRoom {
  id: string;
  name: string;
  location: string;
  capacity: number;
  features: string[];
}

export interface Attendee {
  name: string;
  email: string;
  status: "accepted" | "declined" | "tentative" | "none" | "notresponded";
  type: "required" | "optional" | "resource";
  photo?: string;
}

export interface Organizer {
  name: string;
  email: string;
  photo?: string;
}

export interface Meeting {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  organizer: string;
  organizerDetails?: Organizer;
  attendeeCount: number;
  attendees?: Attendee[];
  roomId: string;
  description?: string;
  isPrivate?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Session {
  user?: User;
  accessToken?: string;
  error?: string;
  expires?: string;
}
