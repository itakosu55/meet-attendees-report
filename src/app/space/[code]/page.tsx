import { getCurrentUser } from "@/infra/auth";
import { MeetService } from "@/application/meet-service";
import { MeetRepository } from "@/infra/meet-repo";
import { ConferenceRecord } from "@/domain/meet";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SpacePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await getCurrentUser();

  if (!user || !user.googleAccessToken) {
    redirect("/");
  }

  const meetRepo = new MeetRepository();
  const meetService = new MeetService(meetRepo);
  const result = await meetService.getConferenceRecordsBySpace(
    code,
    user.googleAccessToken,
  );

  if (result.isErr()) {
    console.error("Failed to fetch conference records:", result.error);
    return (
      <main className="p-10">
        <Card>
          <CardHeader>
            <CardTitle>エラーが発生しました</CardTitle>
            <CardDescription>
              会議録の取得に失敗しました。会議コードが正しいか、連携した Google
              アカウントにアクセス権限があるか確認してください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">指定し直す</Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const records = result.value.conferenceRecords || [];

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">会議一覧</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              会議コード: {code}
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">戻る</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>会議録</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p>この会議コードの履歴は見つかりませんでした。</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>開始時刻</TableHead>
                    <TableHead>終了時刻</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record: ConferenceRecord) => {
                    const id = record.name.replace("conferenceRecords/", "");
                    return (
                      <TableRow key={record.name}>
                        <TableCell>
                          {new Date(record.startTime).toLocaleString("ja-JP")}
                        </TableCell>
                        <TableCell>
                          {new Date(record.endTime).toLocaleString("ja-JP")}
                        </TableCell>
                        <TableCell>
                          <Link href={`/meeting/${id}`}>
                            <Button size="sm">詳細を見る</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
