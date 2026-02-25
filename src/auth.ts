import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

type RefreshErrorType = "RefreshAccessTokenError";

// next-auth/jwt モジュールの型拡張の代わりに、@auth/core/jwt などの最新NextAuth v5の規約に従う、
// もしくは直接コールバック内のtoken引数にアサーションを使用する方法が一般的ですが、
// ここでは NextAuth v5 (beta) で推奨の宣言を使用します
declare module "next-auth" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: RefreshErrorType;
  }
}

if (
  !process.env.AUTH_GOOGLE_ID ||
  !process.env.AUTH_GOOGLE_SECRET ||
  !process.env.AUTH_SECRET
) {
  throw new Error(
    "Missing AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, or AUTH_SECRET environment variables. Please check your .env file.",
  );
}

import { ResultAsync } from "neverthrow";
import type { JWT } from "next-auth/jwt";

export function refreshAccessToken(token: JWT): ResultAsync<JWT, Error> {
  return ResultAsync.fromPromise(
    (async () => {
      if (!token.refreshToken) {
        throw new Error("Missing refresh token");
      }

      const response = await fetch("https://oauth2.googleapis.com/token", {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.AUTH_GOOGLE_ID as string,
          client_secret: process.env.AUTH_GOOGLE_SECRET as string,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken as string,
        }),
        method: "POST",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Token refresh failed: ${response.status} ${errorText}`,
        );
      }

      const tokens = (await response.json()) as {
        access_token: string;
        expires_in: number;
        refresh_token?: string;
      };

      return {
        ...token,
        accessToken: tokens.access_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        refreshToken: tokens.refresh_token ?? (token.refreshToken as string),
        error: undefined,
      };
    })(),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          // Required scope to read conference records and participant sessions
          scope:
            "openid email profile https://www.googleapis.com/auth/meetings.space.readonly",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // 初期サインイン
      if (account) {
        return {
          ...token,
          accessToken: account.access_token as string | undefined,
          refreshToken: account.refresh_token as string | undefined,
          expiresAt: account.expires_at
            ? Math.floor(account.expires_at * 1000)
            : 0,
          error: undefined,
        };
      }

      // アクセストークンがまだ有効な場合は既存のトークンを返す
      if (typeof token.expiresAt === "number" && Date.now() < token.expiresAt) {
        return token;
      }

      // アクセストークンが期限切れの場合の更新処理
      const result = await refreshAccessToken(token);
      return result.match(
        (t) => t,
        (error) => {
          console.error("Error refreshing access token", error);
          return {
            ...token,
            error: "RefreshAccessTokenError" as RefreshErrorType,
          };
        },
      );
    },
    async session({ session, token }) {
      if (!token.sub) {
        throw new Error("Invalid session: missing token.sub");
      }
      session.user.id = token.sub;
      return session;
    },
  },
});
