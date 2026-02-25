"use client";

import { useEffect, useState } from "react";
import { Participant, ParticipantSession } from "@/domain/meet";
import { MeetingTimeline } from "@/components/meeting-timeline";
import pLimit from "p-limit";

interface MeetingSessionsLoaderProps {
  participants: Participant[];
  meetingStartTime: string;
  meetingEndTime: string;
}

export function MeetingSessionsLoader({
  participants,
  meetingStartTime,
  meetingEndTime,
}: MeetingSessionsLoaderProps) {
  const [sessions, setSessions] = useState<ParticipantSession[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Reset state for new participants first
    setSessions([]);
    setLoadedCount(0);
    setIsComplete(false);

    if (participants.length === 0) {
      setIsComplete(true);
      return;
    }

    const abortController = new AbortController();
    const { signal } = abortController;

    const fetchAll = async () => {
      // クライアント側からの API リクエスト並行数を制限する（バックエンドの負荷軽減）
      const limit = pLimit(5);

      const promises = participants.map((participant) =>
        limit(async () => {
          if (signal.aborted) return;

          try {
            const url = `/api/meet/sessions?name=${encodeURIComponent(
              participant.name,
            )}`;
            const res = await fetch(url, { signal });

            if (!res.ok) {
              throw new Error(`API returned ${res.status}`);
            }

            const data = await res.json();
            const result = data.sessions as ParticipantSession[];

            if (!signal.aborted && result) {
              setSessions((prev) => [...prev, ...result]);
            }
          } catch (error) {
            if (error instanceof Error && error.name !== "AbortError") {
              console.error(
                `Failed to fetch session for ${participant.name}`,
                error,
              );
            }
          } finally {
            if (!signal.aborted) {
              setLoadedCount((prev) => prev + 1);
            }
          }
        }),
      );

      try {
        await Promise.all(promises);
        if (!signal.aborted) {
          setIsComplete(true);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("An error occurred during fetchAll", error);
        }
      }
    };

    fetchAll();

    return () => {
      abortController.abort();
    };
  }, [participants]);

  const progressPercentage =
    participants.length === 0
      ? 100
      : Math.floor((loadedCount / participants.length) * 100);

  return (
    <div className="space-y-4">
      {/* サーバーからのセッションデータ取得進捗バー */}
      {!isComplete && (
        <div className="space-y-2 mb-6">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
            参加者のセッション履歴を取得中... ({loadedCount} /{" "}
            {participants.length})
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-zinc-900 dark:bg-zinc-100 h-2.5 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 取得済みのセッションを描画（未完了でも順次描画される） */}
      <MeetingTimeline
        participants={participants}
        sessions={sessions}
        meetingStartTime={meetingStartTime}
        meetingEndTime={meetingEndTime}
      />
    </div>
  );
}
