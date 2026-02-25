import { NextAuthRepository } from "@/infra/next-auth-repo";
import { AuthService } from "@/application/auth-service";

// Auth関連のインスタンス化 (シングルトンとしてエクスポート)
const authRepository = new NextAuthRepository();
export const authService = new AuthService(authRepository);

/**
 * MeetService を遅延ロードして返すファクトリ関数。
 *
 * auth のみを利用するルート（ダッシュボード等）ではこの関数を呼び出さないため、
 * MeetRepository や googleapis などの重い依存関係はロードされません。
 */
export async function getMeetService() {
  const { MeetRepository } = await import("@/infra/meet-repo");
  const { MeetService } = await import("@/application/meet-service");

  const meetRepository = new MeetRepository();
  return new MeetService(meetRepository);
}
