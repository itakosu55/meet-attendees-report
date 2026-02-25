import {
  IMeetRepository,
  ConferenceRecord,
  Participant,
  ParticipantSession,
  MeetApiError,
  SpaceNotFoundError,
} from "@/domain/meet";
import { ResultAsync, okAsync } from "neverthrow";
import pLimit from "p-limit";
import { LRUCache } from "lru-cache";

export interface MeetingDetailsResult {
  record: ConferenceRecord;
  spaceCode: string;
  participants: Participant[];
  allSessions: ParticipantSession[];
}

export interface MeetingBasicInfoResult {
  record: ConferenceRecord;
  spaceCode: string;
  participants: Participant[];
}

const limiters = new LRUCache<string, ReturnType<typeof pLimit>>({
  max: 500, // 最大500ユーザー分のトークンを保持
  ttl: 1000 * 60 * 60, // 1時間でキャッシュから自動破棄 (トークンの有効期限を考慮)
});

function getUserLimit(userId: string) {
  let limit = limiters.get(userId);
  if (!limit) {
    limit = pLimit(5); // ユーザーあたり5並行までとする
    limiters.set(userId, limit);
  }
  return limit;
}

export class MeetService {
  constructor(
    private readonly meetRepository: IMeetRepository,
    private readonly userId: string,
  ) {}

  getConferenceRecordsBySpace(spaceCode: string, accessToken: string) {
    return this.meetRepository.getConferenceRecordsBySpace(
      spaceCode,
      accessToken,
    );
  }

  getMeetingBasicInfo(
    id: string,
    accessToken: string,
  ): ResultAsync<MeetingBasicInfoResult, MeetApiError | SpaceNotFoundError> {
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
      });
  }

  getParticipantSessions(
    participantName: string,
    accessToken: string,
  ): ResultAsync<ParticipantSession[], MeetApiError> {
    const limit = getUserLimit(this.userId);
    return new ResultAsync(
      limit(async () => {
        return await this.meetRepository
          .getParticipantSessions(participantName, accessToken)
          .map((res) => res.participantSessions);
      }),
    );
  }

  getMeetingDetails(
    id: string,
    accessToken: string,
  ): ResultAsync<MeetingDetailsResult, MeetApiError | SpaceNotFoundError> {
    const recordName = `conferenceRecords/${id}`;
    const limit = getUserLimit(this.userId);

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
          limit(() =>
            this.meetRepository
              .getParticipantSessions(p.name, accessToken)
              .match(
                (res) => res.participantSessions,
                () => [], // 一部のセッション取得失敗が全体の失敗にならないようにフォールバック
              ),
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
