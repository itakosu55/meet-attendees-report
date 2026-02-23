import { IMeetRepository } from "@/domain/meet";

export class MeetService {
  constructor(private readonly meetRepository: IMeetRepository) {}

  async getConferenceRecordsBySpace(spaceCode: string, accessToken: string) {
    return this.meetRepository.getConferenceRecordsBySpace(
      spaceCode,
      accessToken,
    );
  }

  async getMeetingDetails(id: string, accessToken: string) {
    const recordName = `conferenceRecords/${id}`;

    const record = await this.meetRepository.getConferenceRecord(
      recordName,
      accessToken,
    );

    let spaceCode = "";
    const meetingCodeForDisplay = id; // Initialize with id as a fallback

    // Fetch space details to get the human-readable meeting code
    if (record.space) {
      try {
        const spaceDetails = await this.meetRepository.getSpace(
          record.space,
          accessToken,
        );
        // Sometimes meetingCode might be undefined if it expired, fallback to the raw space ID
        spaceCode =
          spaceDetails.meetingCode || record.space.replace("spaces/", "");
      } catch (spaceErr) {
        console.warn("Could not fetch space details:", spaceErr);
        // If fetching space details fails, fallback to the raw space ID
        spaceCode = record.space.replace("spaces/", "");
      }
    } else {
      spaceCode = meetingCodeForDisplay;
    }

    const { participants } = await this.meetRepository.getParticipants(
      recordName,
      accessToken,
    );

    const allSessionsPromises = participants.map(async (p) => {
      const res = await this.meetRepository.getParticipantSessions(
        p.name,
        accessToken,
      );
      return res.participantSessions || [];
    });

    const sessionsNested = await Promise.all(allSessionsPromises);
    const allSessions = sessionsNested.flat();

    return {
      record,
      spaceCode,
      participants,
      allSessions,
    };
  }
}
