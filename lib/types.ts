export interface MeetingRoom {
  id: string;
  name: string;
  location: string;
  capacity: number;
  features: string[];
  email?: string;
  floor?: number;
  building?: string;
}

export interface Attendee {
  name: string;
  email: string;
  status:
    | "accepted"
    | "declined"
    | "tentative"
    | "none"
    | "notresponded"
    | string;
  type: "required" | "optional" | "resource" | string;
  photo?: string;
}

export interface Meeting {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  organizer: string;
  organizerDetails?: {
    name: string;
    email: string;
    photo?: string;
  };
  attendeeCount?: number;
  attendees?: Attendee[];
  roomId: string;
  description?: string;
  isPrivate?: boolean;
}
