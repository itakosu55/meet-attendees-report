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

  const sessions = result.match(
    (s) => s,
    () => [],
  );

  return NextResponse.json({ sessions });
}
