import { auth } from "./auth";

// NextAuth の middleware は、マッチしたリクエストに対して自動的に NextAuth の初期化（セッションの取得や Cookie の更新）を行います。
// これにより、Server Components に到達する前に `jwt` コールバックがトリガーされ、期限切れトークンのリフレッシュと
// Cookie ヘッダーの書き換え (Set-Cookie) が確実に行われるようになります。
export default auth;

export const config = {
  // 認証のCookie更新処理を適用するパスのパターン。
  // staticファイル、画像、APIの一部などは除外することが多いですが、
  // 今回は主要なページとAPI（特にServer Component内での取得が関わるもの）に適用します。
  matcher: [
    // _next/static, _next/image, favicon.ico 等の静的ファイルと NextAuth の API 認証エンドポイントを除外
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
