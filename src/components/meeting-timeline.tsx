"use client";

import { useMemo, useState } from "react";
import { Participant, ParticipantSession } from "@/domain/meet";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [minDuration, setMinDuration] = useState<number>(0);

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

  const handleSliderChange = (value: number[]) => {
    if (value.length > 0) {
      setMinDuration(value[0]);
    }
  };

  const calculateTotalDuration = (
    sessions: ParticipantSession[],
    meetingStart: Date,
    meetingEnd: Date,
  ): number => {
    if (sessions.length === 0) return 0;

    // Convert sessions to intervals and clamp them to meeting bounds
    const intervals = sessions.map((s) => {
      const sStart = parseISO(s.startTime);
      const sEnd = parseISO(s.endTime);
      return {
        start: sStart < meetingStart ? meetingStart : sStart,
        end: sEnd > meetingEnd ? meetingEnd : sEnd,
      };
    });

    // Sort intervals by start time
    intervals.sort((a, b) => a.start.getTime() - b.start.getTime());

    let totalDurationMs = 0;
    let currentInterval = intervals[0];

    for (let i = 1; i < intervals.length; i++) {
      const nextInterval = intervals[i];
      if (nextInterval.start <= currentInterval.end) {
        // Intervals overlap or are contiguous; merge them
        if (nextInterval.end > currentInterval.end) {
          currentInterval.end = nextInterval.end;
        }
      } else {
        // No overlap; add the duration of the current interval and move on
        totalDurationMs +=
          currentInterval.end.getTime() - currentInterval.start.getTime();
        currentInterval = nextInterval;
      }
    }

    // Add the duration of the last merged interval
    totalDurationMs +=
      currentInterval.end.getTime() - currentInterval.start.getTime();

    // Convert to minutes
    return Math.floor(totalDurationMs / 60000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      // Clamp value between 0 and totalMinutes
      const clampedValue = Math.min(Math.max(value, 0), totalMinutes);
      setMinDuration(clampedValue);
    } else if (e.target.value === "") {
      setMinDuration(0);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 w-full space-y-3">
            <Label className="text-sm font-medium">
              最小参加時間で絞り込み (分)
            </Label>
            <Slider
              value={[minDuration]}
              max={totalMinutes}
              step={1}
              onValueChange={handleSliderChange}
            />
          </div>
          <div className="w-24 shrink-0 flex items-center gap-2">
            <Input
              type="number"
              value={minDuration.toString()}
              onChange={handleInputChange}
              min={0}
              max={totalMinutes}
              className="text-right"
            />
            <span className="text-sm text-zinc-500">分</span>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {participants
          .map((p) => {
            const participantSessions = sessionsByParticipant.get(p.name) || [];
            const duration = calculateTotalDuration(
              participantSessions,
              meetingStart,
              meetingEnd,
            );
            return { p, participantSessions, duration };
          })
          .filter(({ duration }) => duration >= minDuration)
          .map(({ p, participantSessions, duration }) => {
            const displayName =
              p.signedinUser?.displayName ||
              p.anonymousUser?.displayName ||
              "Unknown User";

            return (
              <Card key={p.name} className="overflow-hidden">
                <div className="p-4 border-b flex justify-between bg-zinc-50 dark:bg-zinc-900">
                  <div className="font-semibold text-sm">{displayName}</div>
                  <div className="text-xs text-zinc-500">
                    {duration} 分 / {participantSessions.length} session(s)
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
