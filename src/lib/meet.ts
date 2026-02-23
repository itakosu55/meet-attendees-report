// src/lib/meet.ts
// Documentation: https://developers.google.com/meet/api/guides/overview

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

import { google } from "googleapis";

/**
 * Returns an authenticated Meet API v2 client.
 */
function getMeetClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.meet({ version: "v2", auth });
}

export async function getConferenceRecordsBySpace(
  spaceCode: string,
  accessToken: string,
): Promise<{ conferenceRecords: ConferenceRecord[]; nextPageToken?: string }> {
  const meet = getMeetClient(accessToken);
  // Optional: can implement pagination if needed using nextPageToken
  const res = await meet.conferenceRecords.list({
    filter: `space.meeting_code="${spaceCode}"`,
  });

  return {
    conferenceRecords: (res.data.conferenceRecords ||
      []) as unknown as ConferenceRecord[],
    nextPageToken: res.data.nextPageToken || undefined,
  };
}

export async function getConferenceRecord(
  recordName: string,
  accessToken: string,
): Promise<ConferenceRecord> {
  const meet = getMeetClient(accessToken);
  const res = await meet.conferenceRecords.get({
    name: recordName,
  });
  return res.data as unknown as ConferenceRecord;
}

export async function getParticipants(
  recordName: string,
  accessToken: string,
): Promise<{ participants: Participant[]; nextPageToken?: string }> {
  const meet = getMeetClient(accessToken);
  const res = await meet.conferenceRecords.participants.list({
    parent: recordName,
  });
  return {
    participants: (res.data.participants || []) as unknown as Participant[],
    nextPageToken: res.data.nextPageToken || undefined,
  };
}

export async function getParticipantSessions(
  participantName: string,
  accessToken: string,
): Promise<{
  participantSessions: ParticipantSession[];
  nextPageToken?: string;
}> {
  const meet = getMeetClient(accessToken);
  const res =
    await meet.conferenceRecords.participants.participantSessions.list({
      parent: participantName,
    });
  return {
    participantSessions: (res.data.participantSessions ||
      []) as unknown as ParticipantSession[],
    nextPageToken: res.data.nextPageToken || undefined,
  };
}

export async function getSpace(
  spaceName: string,
  accessToken: string,
): Promise<{ name: string; meetingCode?: string }> {
  const meet = getMeetClient(accessToken);
  const res = await meet.spaces.get({
    name: spaceName,
  });
  return res.data as { name: string; meetingCode?: string };
}
