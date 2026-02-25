import { NextRequest, NextResponse } from "next/server";
import { authService, meetService } from "@/lib/di";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const participantName = searchParams.get("name");

  if (!participantName) {
    return NextResponse.json(
      { error: "Missing name parameter" },
      { status: 400 },
    );
  }

  const resultSession = await authService.getCurrentSession();
  const session = resultSession.isOk() ? resultSession.value : null;

  // If there is no session, no access token, or a session error, require re-authentication
  const sessionError = session?.error;
  if (!session || sessionError || !session.googleAccessToken) {
    const responseBody = sessionError
      ? {
          error:
            "Unauthorized: access token refresh failed, please sign in again",
          code: "SESSION_REFRESH_FAILED",
        }
      : { error: "Unauthorized" };

    return NextResponse.json(responseBody, { status: 401 });
  }

  const result = await meetService.getParticipantSessions(
    session.user.id,
    participantName,
    session.googleAccessToken,
  );

  if (result.isErr()) {
    console.error(
      `Failed to get sessions for ${participantName}:`,
      result.error,
    );
    return NextResponse.json(
      { error: "Failed to fetch participant sessions" },
      { status: 500 },
    );
  }

  return NextResponse.json({ sessions: result.value });
}
