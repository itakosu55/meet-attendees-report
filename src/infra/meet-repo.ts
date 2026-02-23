import { google } from "googleapis";
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
  private getMeetClient(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.meet({ version: "v2", auth });
  }

  getConferenceRecordsBySpace(
    spaceCode: string,
    accessToken: string,
  ): ResultAsync<
    {
      conferenceRecords: ConferenceRecord[];
      nextPageToken?: string;
    },
    MeetApiError
  > {
    const meet = this.getMeetClient(accessToken);
    return ResultAsync.fromPromise(
      meet.conferenceRecords.list({
        filter: `space.meeting_code="${spaceCode}"`,
      }),
      (error) => new MeetApiError("Failed to list conference records", error),
    ).map((res) => ({
      conferenceRecords: (res.data.conferenceRecords ||
        []) as ConferenceRecord[],
      nextPageToken: res.data.nextPageToken || undefined,
    }));
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

  getParticipants(
    recordName: string,
    accessToken: string,
  ): ResultAsync<
    { participants: Participant[]; nextPageToken?: string },
    MeetApiError
  > {
    const meet = this.getMeetClient(accessToken);
    return ResultAsync.fromPromise(
      meet.conferenceRecords.participants.list({
        parent: recordName,
      }),
      (error) =>
        new MeetApiError(
          `Failed to get participants for: ${recordName}`,
          error,
        ),
    ).map((res) => ({
      participants: (res.data.participants || []) as Participant[],
      nextPageToken: res.data.nextPageToken || undefined,
    }));
  }

  getParticipantSessions(
    participantName: string,
    accessToken: string,
  ): ResultAsync<
    {
      participantSessions: ParticipantSession[];
      nextPageToken?: string;
    },
    MeetApiError
  > {
    const meet = this.getMeetClient(accessToken);
    return ResultAsync.fromPromise(
      meet.conferenceRecords.participants.participantSessions.list({
        parent: participantName,
      }),
      (error) =>
        new MeetApiError(
          `Failed to get sessions for participant: ${participantName}`,
          error,
        ),
    ).map((res) => ({
      participantSessions: (res.data.participantSessions ||
        []) as ParticipantSession[],
      nextPageToken: res.data.nextPageToken || undefined,
    }));
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
