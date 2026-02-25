import { IAuthRepository, AuthSession, AuthApiError } from "@/domain/auth";
import { auth, refreshAccessToken } from "@/auth";
import { ResultAsync } from "neverthrow";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export class NextAuthRepository implements IAuthRepository {
  getCurrentSession(): ResultAsync<AuthSession | null, AuthApiError> {
    return ResultAsync.fromPromise(
      (async () => {
        const session = await auth();
        if (!session) {
          return null;
        }

        if (!session.user || !session.user.id) {
          throw new Error("Invalid session: missing user ID");
        }

        const headersList = await headers();
        // getToken requires a Request/NextRequest instance to read cookies.
        // In Server Components, we only have access to headers().
        // The URL is not actually used by getToken, so "http://localhost" is an intentional dummy value.
        const req = new NextRequest("http://localhost", {
          headers: headersList,
        });

        let token = await getToken({
          req,
          secret: process.env.AUTH_SECRET,
        });

        if (
          token &&
          typeof token.expiresAt === "number" &&
          Date.now() >= token.expiresAt
        ) {
          // Server Components cannot update cookies, so getToken() reads stale data.
          // Manually refresh the token here to ensure API clients get a valid token.
          const refreshResult = await refreshAccessToken(token);
          token = refreshResult.match(
            (t) => t,
            (error) => {
              console.error("Error manually refreshing access token:", error);
              return {
                ...token,
                error: "RefreshAccessTokenError" as const,
              };
            },
          );
        }

        return {
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            picture: session.user.image,
          },
          googleAccessToken: token?.accessToken as string | undefined,
          error: token?.error as "RefreshAccessTokenError" | undefined,
        } as AuthSession;
      })(),
      (error) =>
        new AuthApiError("Failed to get NextAuth session and token", error),
    );
  }
}
