import { IAuthRepository, AuthSession, AuthApiError } from "@/domain/auth";
import { ResultAsync } from "neverthrow";

export class AuthService {
  constructor(private readonly authRepository: IAuthRepository) {}

  getCurrentSession(): ResultAsync<AuthSession | null, AuthApiError> {
    return this.authRepository.getCurrentSession();
  }
}
