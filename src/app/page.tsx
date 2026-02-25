import { AuthService } from "@/application/auth-service";
import { NextAuthRepository } from "@/infra/next-auth-repo";
import { LoginButton } from "@/components/login-button";
import { SpaceForm } from "@/components/space-form";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home() {
  const authRepository = new NextAuthRepository();
  const authService = new AuthService(authRepository);

  const result = await authService.getCurrentSession();
  const session = result.isOk() ? result.value : null;
  const user = session?.user;

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-50 dark:bg-zinc-950">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Meet Attendees Report</CardTitle>
            <CardDescription>
              Google Meet の参加セッションを可視化します
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <LoginButton />
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleLogout = async () => {
    "use server";
    await signOut({ redirectTo: "/" });
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {user.name} ({user.email})
            </p>
            <form action={handleLogout}>
              <Button variant="outline" size="sm">
                ログアウト
              </Button>
            </form>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>会議レポートを検索</CardTitle>
            <CardDescription>
              Meet の会議コード (eg. abc-defg-hij)
              を入力して、会議の参加者レポートを確認します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SpaceForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
