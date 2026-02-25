import { IAuthRepository, AuthSession, AuthApiError } from "@/domain/auth";
import { auth } from "@/auth";
import { ResultAsync, okAsync } from "neverthrow";

export class NextAuthRepository implements IAuthRepository {
  getCurrentSession(): ResultAsync<AuthSession | null, AuthApiError> {
    return ResultAsync.fromPromise(
      auth(),
      (error) => new AuthApiError("Failed to get NextAuth session", error),
    ).andThen((session) => {
      if (!session) {
        return okAsync(null);
      }

      return okAsync({
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          picture: session.user.image,
        },
        googleAccessToken: session.accessToken,
        error: session.error,
      });
    });
  }
}
