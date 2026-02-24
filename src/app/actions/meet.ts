"use server";

import { getCurrentUser } from "@/infra/auth";
import { MeetRepository } from "@/infra/meet-repo";
import { MeetService } from "@/application/meet-service";
import { ParticipantSession } from "@/domain/meet";

export async function getParticipantSessionsAction(
  participantName: string,
): Promise<ParticipantSession[]> {
  const user = await getCurrentUser();
  if (!user || !user.googleAccessToken) {
    throw new Error("Unauthorized");
  }

  const meetRepo = new MeetRepository();
  const meetService = new MeetService(meetRepo);

  const result = await meetService.getParticipantSessions(
    participantName,
    user.googleAccessToken,
  );

  return result.match(
    (sessions) => sessions,
    () => [],
  );
}
