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
  ): Promise<{
    conferenceRecords: ConferenceRecord[];
    nextPageToken?: string;
  }>;

  getConferenceRecord(
    recordName: string,
    accessToken: string,
  ): Promise<ConferenceRecord>;

  getParticipants(
    recordName: string,
    accessToken: string,
  ): Promise<{ participants: Participant[]; nextPageToken?: string }>;

  getParticipantSessions(
    participantName: string,
    accessToken: string,
  ): Promise<{
    participantSessions: ParticipantSession[];
    nextPageToken?: string;
  }>;

  getSpace(
    spaceName: string,
    accessToken: string,
  ): Promise<{ name: string; meetingCode?: string }>;
}
