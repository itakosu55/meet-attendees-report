import { google, meet_v2 } from "googleapis";
import {
  ConferenceRecord,
  IMeetRepository,
  Participant,
  ParticipantSession,
  MeetApiError,
  SpaceNotFoundError,
} from "@/domain/meet";
import { ResultAsync } from "neverthrow";

export class MeetRepository implements IMeetRepository {
  private getMeetClient(accessToken: string): meet_v2.Meet {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.meet({ version: "v2", auth });
  }

  private async fetchConferenceRecordsBySpace(
    meet: meet_v2.Meet,
    spaceCode: string,
  ): Promise<ConferenceRecord[]> {
    const records: ConferenceRecord[] = [];
    let pageToken: string | undefined = undefined;
    const MAX_PAGES = 50;
    let pageCount = 0;
    do {
      const params: meet_v2.Params$Resource$Conferencerecords$List = {
        filter: `space.meeting_code="${spaceCode}"`,
      };
      if (pageToken) params.pageToken = pageToken;
      const res = await meet.conferenceRecords.list(params);
      if (res.data.conferenceRecords) {
        records.push(...(res.data.conferenceRecords as ConferenceRecord[]));
      }
      pageToken = res.data.nextPageToken || undefined;
      pageCount++;
    } while (pageToken && pageCount < MAX_PAGES);
    return records;
  }

  getConferenceRecordsBySpace(
    spaceCode: string,
    accessToken: string,
  ): ResultAsync<ConferenceRecord[], MeetApiError> {
    const meet = this.getMeetClient(accessToken);
    return ResultAsync.fromPromise(
      this.fetchConferenceRecordsBySpace(meet, spaceCode),
      (error) => new MeetApiError("Failed to list conference records", error),
    );
  }

  getConferenceRecord(
    recordName: string,
    accessToken: string,
  ): ResultAsync<ConferenceRecord, MeetApiError> {
    const meet = this.getMeetClient(accessToken);
    return ResultAsync.fromPromise(
      meet.conferenceRecords.get({
        name: recordName,
      }),
      (error) =>
        new MeetApiError(
          `Failed to get conference record: ${recordName}`,
          error,
        ),
    ).map((res) => res.data as ConferenceRecord);
  }

  private async fetchParticipants(
    meet: meet_v2.Meet,
    recordName: string,
  ): Promise<Participant[]> {
    const participants: Participant[] = [];
    let pageToken: string | undefined = undefined;
    const MAX_PAGES = 50;
    let pageCount = 0;
    do {
      const params: meet_v2.Params$Resource$Conferencerecords$Participants$List =
        {
          parent: recordName,
        };
      if (pageToken) params.pageToken = pageToken;
      const res = await meet.conferenceRecords.participants.list(params);
      if (res.data.participants) {
        participants.push(...(res.data.participants as Participant[]));
      }
      pageToken = res.data.nextPageToken || undefined;
      pageCount++;
    } while (pageToken && pageCount < MAX_PAGES);
    return participants;
  }

  getParticipants(
    recordName: string,
    accessToken: string,
  ): ResultAsync<Participant[], MeetApiError> {
    const meet = this.getMeetClient(accessToken);
    return ResultAsync.fromPromise(
      this.fetchParticipants(meet, recordName),
      (error) =>
        new MeetApiError(
          `Failed to get participants for: ${recordName}`,
          error,
        ),
    );
  }

  private async fetchParticipantSessions(
    meet: meet_v2.Meet,
    participantName: string,
  ): Promise<ParticipantSession[]> {
    const sessions: ParticipantSession[] = [];
    let pageToken: string | undefined = undefined;
    const MAX_PAGES = 50;
    let pageCount = 0;
    do {
      const params: meet_v2.Params$Resource$Conferencerecords$Participants$Participantsessions$List =
        {
          parent: participantName,
        };
      if (pageToken) params.pageToken = pageToken;
      const res =
        await meet.conferenceRecords.participants.participantSessions.list(
          params,
        );
      if (res.data.participantSessions) {
        sessions.push(
          ...(res.data.participantSessions as ParticipantSession[]),
        );
      }
      pageToken = res.data.nextPageToken || undefined;
      pageCount++;
    } while (pageToken && pageCount < MAX_PAGES);
    return sessions;
  }

  getParticipantSessions(
    participantName: string,
    accessToken: string,
  ): ResultAsync<ParticipantSession[], MeetApiError> {
    const meet = this.getMeetClient(accessToken);
    return ResultAsync.fromPromise(
      this.fetchParticipantSessions(meet, participantName),
      (error) =>
        new MeetApiError(
          `Failed to get sessions for participant: ${participantName}`,
          error,
        ),
    );
  }

  getSpace(
    spaceName: string,
    accessToken: string,
  ): ResultAsync<
    { name: string; meetingCode?: string },
    MeetApiError | SpaceNotFoundError
  > {
    const meet = this.getMeetClient(accessToken);
    return ResultAsync.fromPromise(
      meet.spaces.get({
        name: spaceName,
      }),
      (error: unknown) => {
        // googleapisのエラー形式に応じて判定
        const err = error as { code?: number };
        if (err.code === 404) {
          return new SpaceNotFoundError(`Space not found: ${spaceName}`, error);
        }
        return new MeetApiError(`Failed to get space: ${spaceName}`, error);
      },
    ).map((res) => res.data as { name: string; meetingCode?: string });
  }
}
