import { ResultAsync } from "neverthrow";

export class MeetApiError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "MeetApiError";
  }
}

export class SpaceNotFoundError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "SpaceNotFoundError";
  }
}

export interface ConferenceRecord {
  name: string;
  startTime: string;
  endTime: string;
  expireTime: string;
  space: string;
}

export interface Participant {
  name: string;
  signedinUser?: {
    user: string;
    displayName: string;
  };
  anonymousUser?: {
    displayName: string;
  };
  earliestStartTime: string;
  latestEndTime: string;
}

export interface ParticipantSession {
  name: string;
  startTime: string;
  endTime: string;
}

export interface IMeetRepository {
  getConferenceRecordsBySpace(
    spaceCode: string,
    accessToken: string,
  ): ResultAsync<ConferenceRecord[], MeetApiError>;

  getConferenceRecord(
    recordName: string,
    accessToken: string,
  ): ResultAsync<ConferenceRecord, MeetApiError>;

  getParticipants(
    recordName: string,
    accessToken: string,
  ): ResultAsync<Participant[], MeetApiError>;

  getParticipantSessions(
    participantName: string,
    accessToken: string,
  ): ResultAsync<ParticipantSession[], MeetApiError>;

  getSpace(
    spaceName: string,
    accessToken: string,
  ): ResultAsync<
    { name: string; meetingCode?: string },
    MeetApiError | SpaceNotFoundError
  >;
}
