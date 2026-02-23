"use client";

import { useMemo } from "react";
import { Participant, ParticipantSession } from "@/domain/meet";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO, differenceInMinutes } from "date-fns";

interface MeetingTimelineProps {
  participants: Participant[];
  sessions: ParticipantSession[];
  meetingStartTime: string;
  meetingEndTime: string;
}

export function MeetingTimeline({
  participants,
  sessions,
  meetingStartTime,
  meetingEndTime,
}: MeetingTimelineProps) {
  // Calculate full meeting duration
  const meetingStart = parseISO(meetingStartTime);
  const meetingEnd = parseISO(meetingEndTime);
  const totalMinutes = differenceInMinutes(meetingEnd, meetingStart) || 1; // avoid division by zero

  // Group sessions by participant
  // The participant ID from ParticipantSession.name is like conferenceRecords/{id}/participants/{participantId}/participantSessions/{sessionId}
  // The Participant name is like conferenceRecords/{id}/participants/{participantId}
  const sessionsByParticipant = useMemo(() => {
    const map = new Map<string, ParticipantSession[]>();
    for (const session of sessions) {
      // Find the participant name from the session name (remove /participantSessions/...)
      const participantName = session.name.split("/participantSessions/")[0];
      if (!map.has(participantName)) {
        map.set(participantName, []);
      }
      map.get(participantName)?.push(session);
    }
    return map;
  }, [sessions]);

  return (
    <div className="space-y-4">
      {participants.map((p) => {
        const participantSessions = sessionsByParticipant.get(p.name) || [];
        const displayName =
          p.signedinUser?.displayName ||
          p.anonymousUser?.displayName ||
          "Unknown User";

        return (
          <Card key={p.name} className="overflow-hidden">
            <div className="p-4 border-b flex justify-between bg-zinc-50 dark:bg-zinc-900">
              <div className="font-semibold text-sm">{displayName}</div>
              <div className="text-xs text-zinc-500">
                {participantSessions.length} session(s)
              </div>
            </div>
            <CardContent className="p-4">
              {/* Timeline track */}
              <div className="relative w-full h-8 bg-zinc-200 dark:bg-zinc-800 rounded-md mt-2">
                {/* Start/End Labels for the track */}
                <div className="absolute -top-6 left-0 text-xs text-zinc-500">
                  {format(meetingStart, "HH:mm")}
                </div>
                <div className="absolute -top-6 right-0 text-xs text-zinc-500">
                  {format(meetingEnd, "HH:mm")}
                </div>

                {participantSessions.map((session) => {
                  const sStart = parseISO(session.startTime);
                  const sEnd = parseISO(session.endTime);

                  // Clamp to meeting bounds visually if preferred
                  const actualStart =
                    sStart < meetingStart ? meetingStart : sStart;
                  const actualEnd = sEnd > meetingEnd ? meetingEnd : sEnd;

                  const startOffsetMins = differenceInMinutes(
                    actualStart,
                    meetingStart,
                  );
                  const durationMins = differenceInMinutes(
                    actualEnd,
                    actualStart,
                  );

                  const leftPercent = Math.max(
                    0,
                    (startOffsetMins / totalMinutes) * 100,
                  );
                  const widthPercent = Math.min(
                    100 - leftPercent,
                    (durationMins / totalMinutes) * 100,
                  );

                  // Tooltip text
                  const startStr = format(sStart, "HH:mm:ss");
                  const endStr = format(sEnd, "HH:mm:ss");

                  return (
                    <div
                      key={session.name}
                      className="absolute h-full bg-blue-500 dark:bg-blue-400 rounded-md group hover:bg-blue-600 transition-colors"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${Math.max(0.5, widthPercent)}%`, // Ensure at least tiny width
                      }}
                      title={`${startStr} - ${endStr}`}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
