import { authService, meetService } from "@/lib/di";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MeetingSessionsLoader } from "@/components/meeting-sessions-loader";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resultSession = await authService.getCurrentSession();
  const session = resultSession.isOk() ? resultSession.value : null;

  // If access token refresh failed, force re-authentication (clear session)
  if (session?.error === "RefreshAccessTokenError") {
    await signOut({ redirectTo: "/" });
    return null; // unreachable due to redirect
  }
  if (!session || !session.googleAccessToken) {
    redirect("/");
  }

  const accessToken = session.googleAccessToken;

  const result = await meetService.getMeetingBasicInfo(id, accessToken);

  if (result.isErr()) {
    console.error("Failed to fetch meeting details:", result.error);
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

  const { record, spaceCode, participants } = result.value;

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
              {new Date(record.startTime).toLocaleString("ja-JP")} 〜{" "}
              {new Date(record.endTime).toLocaleString("ja-JP")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <p>参加者データが見つかりませんでした。</p>
            ) : (
              <MeetingSessionsLoader
                participants={participants}
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
