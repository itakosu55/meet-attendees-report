import { google } from "googleapis";
import {
  ConferenceRecord,
  IMeetRepository,
  Participant,
  ParticipantSession,
} from "@/domain/meet";

export class MeetRepository implements IMeetRepository {
  private getMeetClient(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.meet({ version: "v2", auth });
  }

  async getConferenceRecordsBySpace(
    spaceCode: string,
    accessToken: string,
  ): Promise<{
    conferenceRecords: ConferenceRecord[];
    nextPageToken?: string;
  }> {
    const meet = this.getMeetClient(accessToken);
    const res = await meet.conferenceRecords.list({
      filter: `space.meeting_code="${spaceCode}"`,
    });

    return {
      conferenceRecords: (res.data.conferenceRecords ||
        []) as ConferenceRecord[],
      nextPageToken: res.data.nextPageToken || undefined,
    };
  }

  async getConferenceRecord(
    recordName: string,
    accessToken: string,
  ): Promise<ConferenceRecord> {
    const meet = this.getMeetClient(accessToken);
    const res = await meet.conferenceRecords.get({
      name: recordName,
    });
    return res.data as ConferenceRecord;
  }

  async getParticipants(
    recordName: string,
    accessToken: string,
  ): Promise<{ participants: Participant[]; nextPageToken?: string }> {
    const meet = this.getMeetClient(accessToken);
    const res = await meet.conferenceRecords.participants.list({
      parent: recordName,
    });
    return {
      participants: (res.data.participants || []) as Participant[],
      nextPageToken: res.data.nextPageToken || undefined,
    };
  }

  async getParticipantSessions(
    participantName: string,
    accessToken: string,
  ): Promise<{
    participantSessions: ParticipantSession[];
    nextPageToken?: string;
  }> {
    const meet = this.getMeetClient(accessToken);
    const res =
      await meet.conferenceRecords.participants.participantSessions.list({
        parent: participantName,
      });
    return {
      participantSessions: (res.data.participantSessions ||
        []) as ParticipantSession[],
      nextPageToken: res.data.nextPageToken || undefined,
    };
  }

  async getSpace(
    spaceName: string,
    accessToken: string,
  ): Promise<{ name: string; meetingCode?: string }> {
    const meet = this.getMeetClient(accessToken);
    const res = await meet.spaces.get({
      name: spaceName,
    });
    return res.data as { name: string; meetingCode?: string };
  }
}
