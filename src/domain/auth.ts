import { ResultAsync } from "neverthrow";

/**
 * 認証エラーを表現するカスタムエラー
 */
export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

/**
 * ユーザー情報のエンティティ
 */
export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}

/**
 * セッション情報 (UserとGoogleのアクセストークンを含む)
 */
export interface AuthSession {
  user: User;
  googleAccessToken?: string;
  error?: "RefreshAccessTokenError";
}

/**
 * 認証情報を取得・操作するためのリポジトリインターフェース
 */
export interface IAuthRepository {
  /**
   * 現在のセッション（ログインユーザーとトークン）を取得する
   */
  getCurrentSession(): ResultAsync<AuthSession | null, AuthApiError>;
}
