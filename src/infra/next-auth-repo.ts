import { IAuthRepository, AuthSession, AuthApiError } from "@/domain/auth";
import { auth } from "@/auth";
import { ResultAsync } from "neverthrow";

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

        return {
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            picture: session.user.image,
          },
          googleAccessToken: session.accessToken,
          error: session.error,
        } as AuthSession;
      })(),
      (error) =>
        new AuthApiError("Failed to get NextAuth session and token", error),
    );
  }
}
