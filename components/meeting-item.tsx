import { Clock, Users } from "lucide-react";
import type { Meeting } from "@/lib/types";
import { formatFrenchTime, isMeetingActive } from "@/lib/date-utils";

interface MeetingItemProps {
  meeting: Meeting;
}

export function MeetingItem({ meeting }: MeetingItemProps) {
  const isCurrentMeeting = isMeetingActive(meeting.startTime, meeting.endTime);

  return (
    <div
      className={`p-3 rounded-md border ${
        isCurrentMeeting
          ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30"
          : "bg-card"
      }`}
    >
      <div className="font-medium text-sm">{meeting.subject}</div>
      <div className="flex justify-between items-center mt-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {formatFrenchTime(meeting.startTime)} -{" "}
            {formatFrenchTime(meeting.endTime)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{meeting.attendeeCount}</span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        Organisé par {meeting.organizer}
      </div>
    </div>
  );
}
