import {
  IMeetRepository,
  ConferenceRecord,
  Participant,
  ParticipantSession,
  MeetApiError,
  SpaceNotFoundError,
} from "@/domain/meet";
import { ResultAsync, okAsync } from "neverthrow";

export interface MeetingDetailsResult {
  record: ConferenceRecord;
  spaceCode: string;
  participants: Participant[];
  allSessions: ParticipantSession[];
}

export class MeetService {
  constructor(private readonly meetRepository: IMeetRepository) {}

  getConferenceRecordsBySpace(spaceCode: string, accessToken: string) {
    return this.meetRepository.getConferenceRecordsBySpace(
      spaceCode,
      accessToken,
    );
  }

  getMeetingDetails(
    id: string,
    accessToken: string,
  ): ResultAsync<MeetingDetailsResult, MeetApiError | SpaceNotFoundError> {
    const recordName = `conferenceRecords/${id}`;

    return this.meetRepository
      .getConferenceRecord(recordName, accessToken)
      .andThen((record) => {
        return this.resolveSpaceCode(record, accessToken).map((spaceCode) => ({
          record,
          spaceCode,
        }));
      })
      .andThen(({ record, spaceCode }) => {
        return this.meetRepository
          .getParticipants(recordName, accessToken)
          .map((res) => ({
            record,
            spaceCode,
            participants: res.participants,
          }));
      })
      .andThen(({ record, spaceCode, participants }) => {
        const sessionPromises = participants.map((p) =>
          this.meetRepository.getParticipantSessions(p.name, accessToken).match(
            (res) => res.participantSessions,
            () => [], // 一部のセッション取得失敗が全体の失敗にならないようにフォールバック
          ),
        );

        return ResultAsync.fromSafePromise(Promise.all(sessionPromises)).map(
          (sessionsNested) => ({
            record,
            spaceCode,
            participants,
            allSessions: sessionsNested.flat(),
          }),
        );
      });
  }

  private resolveSpaceCode(
    record: ConferenceRecord,
    accessToken: string,
  ): ResultAsync<string, never> {
    // Spaceコードの特定失敗は致命的エラーにはしない
    const fallbackSpaceCode = record.space
      ? record.space.replace("spaces/", "")
      : "";

    if (!record.space) {
      return okAsync("");
    }

    return this.meetRepository
      .getSpace(record.space, accessToken)
      .map((spaceDetails) => spaceDetails.meetingCode || fallbackSpaceCode)
      .orElse(() => okAsync(fallbackSpaceCode));
  }
}
