import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";

type RefreshErrorType = "RefreshAccessTokenError";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: RefreshErrorType;
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// next-auth/jwt モジュールの型拡張の代わりに、@auth/core/jwt などの最新NextAuth v5の規約に従う、
// もしくは直接コールバック内のtoken引数にアサーションを使用する方法が一般的ですが、
// ここでは NextAuth v5 (beta) で推奨の宣言を使用します
declare module "next-auth" {
  interface jwt {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: RefreshErrorType;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        };
      }

      // アクセストークンがまだ有効な場合は既存のトークンを返す
      if (typeof token.expiresAt === "number" && Date.now() < token.expiresAt) {
        return token;
      }

      // アクセストークンが期限切れの場合の更新処理
      try {
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

        // tokens as unknown as { ... } 等で型を明示して TS2322 などの unknown 型エラーを回避
        const tokens = (await response.json()) as {
          access_token: string;
          expires_in: number;
          refresh_token?: string;
        };

        if (!response.ok) throw tokens;

        return {
          ...token,
          accessToken: tokens.access_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
          refreshToken: tokens.refresh_token ?? (token.refreshToken as string),
        };
      } catch (error) {
        console.error("Error refreshing access token", error);
        // このエラーでクライアント側に再ログインを促すことができる
        return {
          ...token,
          error: "RefreshAccessTokenError" as RefreshErrorType,
        };
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.error = token.error as RefreshErrorType | undefined;
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
