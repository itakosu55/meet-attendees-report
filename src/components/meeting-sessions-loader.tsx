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
    let mounted = true;

    if (participants.length === 0) {
      setIsComplete(true);
      return;
    }

    // Reset state in case of component reuse with new participants
    setSessions([]);
    setLoadedCount(0);
    setIsComplete(false);
    const fetchAll = async () => {
      // クライアント側からの Server Actions リクエスト並行数を制限する（バックエンドの負荷軽減）
      const limit = pLimit(5);

      const promises = participants.map((participant) =>
        limit(async () => {
          if (!mounted) return;
          try {
            const url = `/api/meet/sessions?name=${encodeURIComponent(participant.name)}`;
            const res = await fetch(url);

            if (!res.ok) {
              throw new Error(`API returned ${res.status}`);
            }

            const data = await res.json();
            const result = data.sessions as ParticipantSession[];

            if (mounted && result) {
              setSessions((prev) => [...prev, ...result]);
            }
          } catch (error) {
            console.error(
              `Failed to fetch session for ${participant.name}`,
              error,
            );
          } finally {
            if (mounted) {
              setLoadedCount((prev) => prev + 1);
            }
          }
        }),
      );

      await Promise.all(promises);
      if (mounted) {
        setIsComplete(true);
      }
    };

    fetchAll();

    return () => {
      mounted = false;
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
