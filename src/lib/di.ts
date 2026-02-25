import { NextAuthRepository } from "@/infra/next-auth-repo";
import { AuthService } from "@/application/auth-service";
import { MeetRepository } from "@/infra/meet-repo";
import { MeetService } from "@/application/meet-service";

// リポジトリのインスタンス化
const authRepository = new NextAuthRepository();
const meetRepository = new MeetRepository();

// サービスのインスタンス化 (シングルトンとしてエクスポート)
export const authService = new AuthService(authRepository);
export const meetService = new MeetService(meetRepository);
