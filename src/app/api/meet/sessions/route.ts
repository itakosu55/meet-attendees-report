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

  // If the access token refresh failed, require the user to re-authenticate
  if (session && session.error === "RefreshAccessTokenError") {
    return NextResponse.json(
      {
        error:
          "Unauthorized: access token refresh failed, please sign in again",
      },
      { status: 401 },
    );
  }
  if (!session || !session.googleAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
