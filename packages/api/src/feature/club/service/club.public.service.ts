import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import {
  IClubSummary,
  IClubSummaryResponse,
  IDivisionSummary,
} from "@sparcs-clubs/interface/api/club/type/club.type";
import { ISemester } from "@sparcs-clubs/interface/api/club/type/semester.type";
import { IStudentSummary } from "@sparcs-clubs/interface/api/user/type/user.type";
import { ClubTypeEnum } from "@sparcs-clubs/interface/common/enum/club.enum";

import { getKSTDate } from "@sparcs-clubs/api/common/util/util";
import DivisionRepository from "@sparcs-clubs/api/feature/division/repository/division.repository";
import DivisionPublicService from "@sparcs-clubs/api/feature/division/service/division.public.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import { ClubDelegateDRepository } from "../delegate/club.club-delegate-d.repository";
import { MClub } from "../model/club.model";
import ClubStudentTRepository from "../repository/club.club-student-t.repository";
import ClubTRepository from "../repository/club.club-t.repository";
import ClubRepository from "../repository/club.repository";
import SemesterDRepository from "../repository/club.semester-d.repository";

@Injectable()
export default class ClubPublicService {
  constructor(
    private clubDelegateDRepository: ClubDelegateDRepository,
    private clubRepository: ClubRepository,
    private clubTRepository: ClubTRepository,
    private clubStudentTRepository: ClubStudentTRepository,
    private semesterDRepository: SemesterDRepository,
    private divisionRepository: DivisionRepository,
    private divisionPublicService: DivisionPublicService,
    private userPublicService: UserPublicService,
  ) {}

  // semester common repositoryf를 제거하는 과정에서 발생한 프록시입니다. 사용하지 않는 것을 권장합니다.
  async findSemesterBetweenstartTermAndendTerm() {
    return this.semesterDRepository.findSemesterBetweenstartTermAndendTerm();
  }

  // date를 포함하고 있는 학기의 semesterId를 리턴합니다.
  // 만약 해당하는 semester가 존재하지 않을 경우, undefined를 리턴합니다.
  async dateToSemesterId(date: Date): Promise<number | undefined> {
    const result = await this.semesterDRepository.findByDate(date);

    if (result.length !== 1) {
      return undefined;
    }
    return result[0].id;
  }

  // 학생(studentId)이 현재 학기 동아리(clubId)에 소속되어 있는지 확인합니다.
  // studentId와 clubId가 유효한지 검사하지 않습니다.
  async isStudentBelongsTo(studentId: number, clubId: number) {
    const semesterId = await this.dateToSemesterId(getKSTDate());
    if (semesterId === undefined)
      throw new HttpException(
        "Today is not in semester",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    const result = await this.clubStudentTRepository.findByClubIdAndSemesterId(
      clubId,
      semesterId,
    );

    if (result.find(row => row.studentId === studentId)) return true;
    return false;
  }

  /**
   * @returns 이번 학기 활동중인 동아리 목록을 리턴합니다.
   */
  async getAtivatedClubs() {
    const semesterId = await this.dateToSemesterId(getKSTDate());
    if (semesterId === undefined)
      throw new HttpException(
        "Today is not in semester",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    const clubTs = await this.clubTRepository.selectBySemesterId(semesterId);
    const result = await Promise.all(
      clubTs.map(async clubT => {
        const club = await this.clubRepository.findByClubId(clubT.clubId);
        if (club.length === 0 || club.length > 1)
          throw new HttpException(
            "unreachable",
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        return {
          club: club[0],
          clubT,
        };
      }),
    );

    return result;
  }

  /**
   * @param param
   * @returns 해당 동아리에서 해당 기간동안 활동했던 학생 목록을 리턴합니다.
   */
  async getMemberFromDuration(param: {
    clubId: number;
    duration: {
      startTerm: Date;
      endTerm: Date;
    };
  }): Promise<
    Array<{
      studentId: number;
      name: string;
      studentNumber: number;
    }>
  > {
    const result =
      await this.clubStudentTRepository.selectStudentByClubIdAndDuration({
        clubId: param.clubId,
        duration: param.duration,
      });

    return result.map(e => ({
      studentId: e.id,
      name: e.name,
      studentNumber: e.number,
    }));
  }

  async getMemberFromSemester(param: { semesterId: number; clubId: number }) {
    const result = await this.clubStudentTRepository.findByClubIdAndSemesterId(
      param.clubId,
      param.semesterId,
    );

    return result;
  }

  /**
   * @param studentId 학생 id
   * @returns 해당 학생이 할동한 동아리와 기간을 리턴합니다.
   */
  async getClubBelongDurationOfStudent(param: { studentId: number }) {
    return this.clubRepository.findClubActivities(param.studentId);
  }

  /**
   * @param clubId 동아리 Id
   * @returns 동아리 id가 일치하는 동아리 목록을 리턴합니다.
   * 시스템에 문제가 없다면 리스트이 길이는 0 또는 1 이여야 합니다.
   */
  async getClubByClubId(param: { clubId: number }) {
    return this.clubRepository.findByClubId(param.clubId);
  }

  /**
   * @param clubId 동아리 id
   * @returns 동아리가 등록되었던 학기 정보들을 리턴합니다.
   */
  async getClubsExistedSemesters(param: { clubId: number }) {
    const semesters = await this.semesterDRepository.selectByClubId(param);
    return semesters;
  }

  // 학생(studentId)이 현재 학기 동아리(clubId)의 대표자 중 1명인지 확인합니다.
  // studentId와 clubId가 유효한지 검사하지 않습니다.
  async isStudentDelegate(studentId: number, clubId: number): Promise<boolean> {
    const representatives =
      await this.clubDelegateDRepository.findRepresentativeIdListByClubId(
        clubId,
      );

    if (
      representatives.find(row => row.studentId === studentId) === undefined
    ) {
      return false;
    }
    return true;
  }

  async checkStudentDelegate(studentId: number, clubId: number) {
    if (!(await this.isStudentDelegate(studentId, clubId))) {
      throw new HttpException(
        "It seems that you are not the delegate of the club.",
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * @param clubStatusEnumId 동아리 상태 enum id의 배열
   * @param studentId 사용중인 학생 id
   * @param semesterId 신청 학기 id
   * @returns 특정 학기의 특정 상태(정동아리/가동아리/정동아리 or 가동아리)의 동아리(clubId) list
   * 예를 들어, getClubIdByClubStatusEnumId([ClubTypeEnum.Regular], semesterId) 의 경우,
   * semesterId 학기 당시 정동아리였던 동아리의 clubId list를 반환합니다.
   */
  async getClubIdByClubStatusEnumId(
    studentId: number,
    clubStatusEnumIds: Array<ClubTypeEnum>,
    semesterId: number,
  ) {
    const clubList = await this.clubRepository.findClubIdByClubStatusEnumId(
      studentId,
      clubStatusEnumIds,
      semesterId,
    );
    return clubList;
  }

  /**
   * @param studentId
   * @param semesterId
   * @returns 신규 등록 신청이 가능한 동아리 list
   * 신청 학기를 기준으로 아래에 포함되는 clubId list를 반환합니다.
   * 1. 최근 2학기 동안 가동아리 상태를 유지한 동아리
   * 2. 최근 3학기 이내 한 번이라도 정동아리였던 동아리
   */
  async getEligibleClubsForRegistration(studentId: number, semesterId: number) {
    const clubList = await this.clubRepository.findEligibleClubsForRegistration(
      studentId,
      semesterId,
    );
    return clubList;
  }

  async isStudentPresident(
    studentId: number,
    clubId: number,
  ): Promise<boolean> {
    const isPresident =
      await this.clubDelegateDRepository.isPresidentByStudentIdAndClubId(
        studentId,
        clubId,
      );
    return isPresident;
  }

  /**
   * @param studentId 학생의 ID
   * @param clubId 동아리의 ID
   * @returns void
   *
   * 학생을 특정 동아리에 추가합니다.
   * 이 메소드는 현재 학기(`semesterId`)에 해당하는 동아리에 학생을 추가합니다.
   * 현재 학기를 기준으로 `semesterId`를 조회하고, 조회된 학기가 없는 경우 예외를 발생시킵니다.
   * 조회된 `semesterId`를 사용하여 해당 동아리(`clubId`)에 학생(`studentId`)을 추가합니다.
   */

  async addStudentToClub(studentId: number, clubId: number): Promise<void> {
    const cur = getKSTDate(); // 현재 KST 시간을 가져옴

    const semesterId = await this.dateToSemesterId(cur);
    if (!semesterId) {
      throw new HttpException(
        "No current semester found.",
        HttpStatus.NOT_FOUND,
      );
    }

    const clubT = await this.clubTRepository.findByClubIdAndSemesterId(
      clubId,
      semesterId,
    );
    if (!semesterId) {
      throw new HttpException(
        "The club is not found at that semester.",
        HttpStatus.NOT_FOUND,
      );
    }

    // 신입 부원 추가
    await this.clubStudentTRepository.addStudentToClub(
      studentId,
      clubId,
      semesterId,
      clubT.startTerm,
    );
  }

  /**
   * 학생을 특정 동아리에서 제거합니다.
   *
   * @param studentId 학생의 ID
   * @param clubId 동아리의 ID
   * @returns void
   *
   * 이 메소드는 현재 학기(`semesterId`)에 해당하는 동아리에서 학생을 제거합니다.
   * 현재 학기를 기준으로 `semesterId`를 조회하고, 조회된 학기가 없는 경우 예외를 발생시킵니다.
   * 조회된 `semesterId`를 사용하여 해당 동아리(`clubId`)에서 학생(`studentId`)을 제거합니다.
   */
  async removeStudentFromClub(
    studentId: number,
    clubId: number,
  ): Promise<void> {
    const cur = getKSTDate(); // 현재 KST 시간을 가져옴

    const semesterId = await this.dateToSemesterId(cur);
    if (!semesterId) {
      throw new HttpException(
        "No current semester found.",
        HttpStatus.NOT_FOUND,
      );
    }

    const isTargetStudentDelegate = await this.isStudentDelegate(
      studentId,
      clubId,
    );
    // 신입 부원 제거
    await this.clubStudentTRepository.removeStudentFromClub(
      studentId,
      clubId,
      semesterId,
      isTargetStudentDelegate,
    );
  }

  /**
   * Semester랑 ClubIds 로 해당 동아리들을 하는 모든 Member의 IStudentSummary의 Union을 가져옵니다.
   *
   * @param semesterId 학기의 ID
   * @param clubIds 동아리의 ID []
   * @returns StudentsSummary[]
   *
   */

  async getUnionMemberSummaries(
    semesterId: number,
    clubIds: number[],
  ): Promise<IStudentSummary[]> {
    const result =
      await this.clubStudentTRepository.findUnionByClubIdsAndSemesterId(
        clubIds,
        semesterId,
      );

    return result;
  }

  // date를 포함하고 있는 학기의 semesterId를 리턴합니다.
  // 만약 해당하는 semester가 존재하지 않을 경우, 404에러를 throw 하니 예외처리를 하지 않아도 됩니다.
  // date를 넣지 않으면 현재 날짜를 기준으로 합니다.
  async fetchSemester(date?: Date): Promise<ISemester> {
    const targetDate = date || getKSTDate();
    return this.semesterDRepository.fetch(targetDate);
  }

  async fetchSummary(id: number): Promise<IClubSummary> {
    const result = await this.clubRepository.fetchSummary(id);
    return result;
  }

  async fetchSummaries(ids: number[]): Promise<IClubSummary[]> {
    const results = await this.clubRepository.fetchSummaries(ids);
    return results;
  }

  async fetchDivisionSummaries(ids: number[]): Promise<IDivisionSummary[]> {
    const results = await this.divisionRepository.fetchSummaries(ids);
    return results;
  }

  /**
   * @param studentId 신청자 학생 Id
   * @returns 학생이 대표자 또는 대의원으로 있는 동아리의 clubId를 반환합니다. 대표자 또는 대의원이 아닐 경우 null을 반환합니다.
   * TODO: IClub로 변경 필요
   */

  async findStudentClubDelegate(
    studentId: number,
  ): Promise<IClubSummary | null> {
    const result =
      await this.clubDelegateDRepository.findDelegateByStudentId(studentId);

    if (result.length === 0) return null;
    const club = await this.clubRepository.fetchSummary(result[0].clubId);
    return club;
  }

  async makeClubSummaryResponse(
    club: IClubSummary | { id: IClubSummary["id"] },
  ): Promise<IClubSummaryResponse> {
    const clubParam =
      "name" in club ? club : await this.clubRepository.fetchSummary(club.id);

    const division = await this.divisionPublicService.getDivisionById({
      id: clubParam.division.id,
    });
    return {
      ...clubParam,
      division: division[0],
    };
  }

  async fetch(
    clubId: number,
    semester: Pick<ISemester, "id"> | ISemester,
    date?: Date,
  ): Promise<MClub> {
    const semesterParam =
      "endTerm" in semester
        ? semester
        : await this.semesterDRepository.fetch(semester.id);
    const result = await this.clubRepository.fetch(clubId, semesterParam, date);
    return result;
  }

  async find(
    clubId: number,
    semester: Pick<ISemester, "id"> | ISemester,
    date?: Date,
  ): Promise<MClub | null> {
    const semesterParam =
      "endTerm" in semester
        ? semester
        : await this.semesterDRepository.fetch(semester.id);
    const result = await this.clubRepository.findOne(
      clubId,
      semesterParam,
      date,
    );
    return result;
  }

  /**
   * @param clubId 동아리 id
   * @param semesterIds 학기 id 배열
   * @returns 동아리의 학기별 상태를 리턴합니다.
   */
  async getClubSummariesByClubIdAndSemesterIds(
    clubId: number,
    semesterIds: number[],
  ): Promise<IClubSummary[]> {
    const clubs = await this.clubRepository.fetchSummaries(
      [clubId],
      semesterIds,
    );

    return clubs;
  }
}
