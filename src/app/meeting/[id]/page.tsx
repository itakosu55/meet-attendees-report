import { getCurrentUser } from "@/infra/auth";
import { MeetRepository } from "@/infra/meet-repo";
import { MeetService } from "@/application/meet-service";
import {
  ConferenceRecord,
  Participant,
  ParticipantSession,
} from "@/domain/meet";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MeetingTimeline } from "@/components/meeting-timeline";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || !user.googleAccessToken) {
    redirect("/");
  }

  const accessToken = user.googleAccessToken;

  let record: ConferenceRecord | null = null;
  let participants: Participant[] = [];
  let allSessions: ParticipantSession[] = [];
  let spaceCode = "";

  try {
    const meetRepo = new MeetRepository();
    const meetService = new MeetService(meetRepo);
    const details = await meetService.getMeetingDetails(id, accessToken);

    record = details.record;
    spaceCode = details.spaceCode;
    participants = details.participants;
    allSessions = details.allSessions;
  } catch (error) {
    console.error("Failed to fetch meeting details:", error);
    return (
      <main className="p-10">
        <Card>
          <CardHeader>
            <CardTitle>エラーが発生しました</CardTitle>
            <CardDescription>
              ミーティングデータの取得に失敗しました。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>ダッシュボードへ戻る</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              参加セッションレポート
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              会議録ID: {id}
            </p>
          </div>
          <Link href={`/space/${spaceCode}`}>
            <Button variant="outline">会議一覧へ戻る</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>タイムライン</CardTitle>
            <CardDescription>
              {record && (
                <>
                  {new Date(record.startTime).toLocaleString("ja-JP")} 〜{" "}
                  {new Date(record.endTime).toLocaleString("ja-JP")}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {participants.length === 0 || !record ? (
              <p>参加者データが見つかりませんでした。</p>
            ) : (
              <MeetingTimeline
                participants={participants}
                sessions={allSessions}
                meetingStartTime={record.startTime}
                meetingEndTime={record.endTime}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
