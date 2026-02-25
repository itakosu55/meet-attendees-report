import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/infra/auth";
import { MeetRepository } from "@/infra/meet-repo";
import { MeetService } from "@/application/meet-service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const participantName = searchParams.get("name");

  if (!participantName) {
    return NextResponse.json(
      { error: "Missing name parameter" },
      { status: 400 },
    );
  }

  const user = await getCurrentUser();
  if (!user || !user.googleAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meetRepo = new MeetRepository();
  const meetService = new MeetService(meetRepo);

  const result = await meetService.getParticipantSessions(
    participantName,
    user.googleAccessToken,
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
