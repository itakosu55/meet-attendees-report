"use client";

import { useMemo, useState } from "react";
import { Participant, ParticipantSession } from "@/domain/meet";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { format, parseISO, differenceInMinutes } from "date-fns";

interface MeetingTimelineProps {
  participants: Participant[];
  sessions: ParticipantSession[];
  meetingStartTime: string;
  meetingEndTime: string;
}

function calculateTotalDuration(sessions: ParticipantSession[]): number {
  if (sessions.length === 0) return 0;

  // Convert to Date objects and sort by start time
  const intervals = sessions
    .map((s) => ({
      start: parseISO(s.startTime),
      end: parseISO(s.endTime),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  let totalMilliseconds = 0;
  let currentInterval = intervals[0];

  for (let i = 1; i < intervals.length; i++) {
    const nextInterval = intervals[i];

    if (nextInterval.start <= currentInterval.end) {
      // Intervals overlap, merge them by extending the end time
      currentInterval.end = new Date(
        Math.max(currentInterval.end.getTime(), nextInterval.end.getTime()),
      );
    } else {
      // Intervals do not overlap, add the current one to the total
      totalMilliseconds +=
        currentInterval.end.getTime() - currentInterval.start.getTime();
      currentInterval = nextInterval;
    }
  }

  // Add the last interval
  totalMilliseconds +=
    currentInterval.end.getTime() - currentInterval.start.getTime();

  // Convert total milliseconds to minutes and round down
  return Math.floor(totalMilliseconds / 60000);
}

export function MeetingTimeline({
  participants,
  sessions,
  meetingStartTime,
  meetingEndTime,
}: MeetingTimelineProps) {
  const [minDuration, setMinDuration] = useState<number>(0);

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

  const filteredParticipants = useMemo(() => {
    if (minDuration <= 0) return participants;

    return participants.filter((p) => {
      const participantSessions = sessionsByParticipant.get(p.name) || [];
      const totalDuration = calculateTotalDuration(participantSessions);
      return totalDuration >= minDuration;
    });
  }, [participants, sessionsByParticipant, minDuration]);

  const handleSliderChange = (value: number[]) => {
    setMinDuration(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      // Clamp between 0 and totalMinutes
      const clampedVal = Math.max(0, Math.min(totalMinutes, val));
      setMinDuration(clampedVal);
    } else if (e.target.value === "") {
      setMinDuration(0);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-white dark:bg-zinc-950 border">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full flex items-center gap-4">
            <span className="text-sm font-medium whitespace-nowrap">
              最小参加時間
            </span>
            <Slider
              min={0}
              max={totalMinutes}
              step={1}
              value={[minDuration]}
              onValueChange={handleSliderChange}
              className="max-w-xs"
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={totalMinutes}
                value={minDuration === 0 ? "" : minDuration}
                placeholder="0"
                onChange={handleInputChange}
                className="w-20 text-right"
              />
              <span className="text-sm text-zinc-500 whitespace-nowrap">
                分
              </span>
            </div>
          </div>
          <div className="text-sm font-medium whitespace-nowrap">
            表示中: {filteredParticipants.length}人 / 全体:{" "}
            {participants.length}人
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredParticipants.map((p) => {
          const participantSessions = sessionsByParticipant.get(p.name) || [];
          const displayName =
            p.signedinUser?.displayName ||
            p.anonymousUser?.displayName ||
            "Unknown User";
          const totalDuration = calculateTotalDuration(participantSessions);

          return (
            <Card key={p.name} className="overflow-hidden">
              <div className="p-4 border-b flex justify-between bg-zinc-50 dark:bg-zinc-900">
                <div className="font-semibold text-sm flex items-center gap-2">
                  {displayName}
                  <span className="text-xs font-normal text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    約 {totalDuration} 分
                  </span>
                </div>
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
    </div>
  );
}
