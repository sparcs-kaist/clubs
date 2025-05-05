import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { ClubDelegateEnum } from "@clubs/domain/club/club-delegate";
import { ISemester } from "@clubs/domain/semester/semester";

import {
  IClubSummary,
  IClubSummaryResponse,
  IDivisionSummary,
} from "@clubs/interface/api/club/type/club.type";
import { IStudentSummary } from "@clubs/interface/api/user/type/user.type";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

import OldDivisionRepository from "@sparcs-clubs/api/feature/division/repository/old.division.repository";
import DivisionPublicService from "@sparcs-clubs/api/feature/division/service/division.public.service";
import { SemesterPublicService } from "@sparcs-clubs/api/feature/semester/publicService/semester.public.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import { ClubDelegateDRepository } from "../delegate/club.club-delegate-d.repository";
import { RMClub } from "../model/club.model";
import { MClubOld } from "../model/club-old.model";
import { ClubRepository } from "../repository/club.repository";
import { ClubDelegateRepository } from "../repository/club-delegate-repository";
import { ClubDivisionHistoryRepository } from "../repository/club-division-history.repository";
import { ClubSemesterRepository } from "../repository/club-semester.repository";
import ClubStudentTRepository from "../repository-old/club.club-student-t.repository";
import ClubTRepository from "../repository-old/club.club-t.repository";
import { DivisionPermanentClubDRepository } from "../repository-old/club.division-permanent-club-d.repository";
import { ClubOldRepository } from "../repository-old/club-old.repository";

@Injectable()
export default class ClubPublicService {
  constructor(
    private clubDelegateDRepository: ClubDelegateDRepository,
    private clubOldRepository: ClubOldRepository,
    private clubTRepository: ClubTRepository,
    private clubStudentTRepository: ClubStudentTRepository,
    private oldOldDivisionRepository: OldDivisionRepository,
    private divisionPublicService: DivisionPublicService,
    private divisionPermanentClubDRepository: DivisionPermanentClubDRepository,
    private userPublicService: UserPublicService,
    private semesterPublicService: SemesterPublicService,
    private clubRepository: ClubRepository,
    private clubSemesterRepository: ClubSemesterRepository,
    private clubDelegateRepository: ClubDelegateRepository,
    private clubDivisionHistoryRepository: ClubDivisionHistoryRepository,
  ) {}

  // 학생(studentId)이 현재 학기 동아리(clubId)에 소속되어 있는지 확인합니다.
  // studentId와 clubId가 유효한지 검사하지 않습니다.
  async isStudentBelongsTo(studentId: number, clubId: number) {
    const semesterId = await this.semesterPublicService.load().then(e => e.id);
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
    const semesterId = await this.semesterPublicService.loadId();
    if (semesterId === undefined)
      throw new HttpException(
        "Today is not in semester",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    const clubTs = await this.clubTRepository.selectBySemesterId(semesterId);
    const result = await Promise.all(
      clubTs.map(async clubT => {
        const club = await this.clubOldRepository.findByClubId(clubT.clubId);
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
    return this.clubOldRepository.findClubActivities(param.studentId);
  }

  /**
   * @param clubId 동아리 Id
   * @returns 동아리 id가 일치하는 동아리 목록을 리턴합니다.
   * 시스템에 문제가 없다면 리스트이 길이는 0 또는 1 이여야 합니다.
   */
  async getClubByClubId(param: { clubId: number }) {
    return this.clubOldRepository.findByClubId(param.clubId);
  }

  /**
   * @param clubId 동아리 id
   * @returns 동아리가 등록되었던 학기 정보들을 리턴합니다.
   */
  async getClubsExistedSemesters(param: { clubId: number }) {
    const semesters = await this.clubTRepository.findSemesterByClubId(
      param.clubId,
    );
    return semesters;
  }

  /**
   * @description 학생이 동아리의 대표자인지 확인합니다.
   * @param studentId 학생 id
   * @param clubId 동아리 id
   * @returns boolean
   */

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

  /**
   * @description 학생이 동아리의 대표자인지 체크하여, 아닌 경우 FORBIDDEN 에러를 발생시킵니다.
   * @param studentId 학생 id
   * @param clubId 동아리 id
   * @returns void
   */
  async checkStudentDelegate(studentId: number, clubId: number): Promise<void> {
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
    const clubList = await this.clubOldRepository.findClubIdByClubStatusEnumId(
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
    const clubList =
      await this.clubOldRepository.findEligibleClubsForRegistration(
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
    const semesterId = await this.semesterPublicService.loadId();
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
    const semesterId = await this.semesterPublicService.loadId();
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

  async fetchSummary(id: number): Promise<IClubSummary> {
    const result = await this.clubOldRepository.fetchSummary(id);
    return result;
  }

  async fetchSummaries(ids: number[]): Promise<IClubSummary[]> {
    const results = await this.clubOldRepository.fetchSummaries(ids);
    return results;
  }

  async fetchDivisionSummaries(ids: number[]): Promise<IDivisionSummary[]> {
    const results = await this.oldOldDivisionRepository.fetchSummaries(ids);
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
    const club = await this.clubOldRepository.fetchSummary(result[0].clubId);
    return club;
  }

  async makeClubSummaryResponse(
    club: IClubSummary | { id: IClubSummary["id"] },
  ): Promise<IClubSummaryResponse> {
    const clubParam =
      "name" in club
        ? club
        : await this.clubOldRepository.fetchSummary(club.id);

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
  ): Promise<MClubOld> {
    const semesterParam =
      "endTerm" in semester
        ? semester
        : await this.semesterPublicService.getById(semester.id);
    const result = await this.clubOldRepository.fetch(
      clubId,
      semesterParam,
      date,
    );
    return result;
  }

  async find(
    clubId: number,
    semester: Pick<ISemester, "id"> | ISemester,
    date?: Date,
  ): Promise<MClubOld | null> {
    const semesterParam =
      "endTerm" in semester
        ? semester
        : await this.semesterPublicService.getById(semester.id);
    const result = await this.clubOldRepository.findOne(
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
    const clubs = await this.clubOldRepository.fetchSummaries(
      [clubId],
      semesterIds,
    );

    return clubs;
  }

  async isPermanentClubsByClubId(clubId: number) {
    const club =
      await this.divisionPermanentClubDRepository.findPermenantClub(clubId);
    return club;
  }

  /**
   * @param clubId 동아리 id
   * @returns 동아리의 등록된 SemesterId목록을 리턴합니다.
   */
  async searchSemesterIdsByClubId(clubId: number): Promise<number[]> {
    const clubSemester = await this.clubSemesterRepository.find({
      clubId,
    });
    return clubSemester.map(c => c.semester.id);
  }

  async searchClubDetailByDate(query: {
    date: Date;
    clubId?: number | number[];
    name?: string;
    clubTypeEnum?: ClubTypeEnum | ClubTypeEnum[];
  }): Promise<RMClub[]> {
    const semester = await this.semesterPublicService.load({
      date: query.date,
    });
    const [clubs, clubSemesters, divisions, clubDivisions, clubDelegates] =
      await Promise.all([
        this.clubRepository.find({
          or: query.name
            ? {
                nameKr: { like: query.name },
                nameEn: { like: query.name },
              }
            : undefined,
        }),
        this.clubSemesterRepository.find({
          semesterId: semester.id,
          clubId: query.clubId,
        }),
        this.divisionPublicService.search({ date: query.date }),
        this.clubDivisionHistoryRepository.find({
          date: query.date,
          clubId: query.clubId,
        }),
        this.clubDelegateRepository.find({
          date: query.date,
          clubId: query.clubId,
        }),
      ]);

    const [students, professors] = await Promise.all([
      this.userPublicService.getStudentsByIds(
        clubDelegates.map(c => c.student.id),
      ),
      this.userPublicService.getProfessorsByIds(
        clubSemesters.filter(c => c.professor).map(c => c.professor.id),
      ),
    ]);

    const clubSemesterMap = new Map(clubSemesters.map(c => [c.club.id, c]));
    const divisionMap = new Map(divisions.map(d => [d.id, d]));
    const clubDivisionMap = new Map(clubDivisions.map(c => [c.club.id, c]));
    const clubRepresentativeMap = new Map(
      clubDelegates
        .filter(
          delegate =>
            delegate.clubDelegateEnum === ClubDelegateEnum.Representative,
        )
        .map(c => [c.club.id, c]),
    );
    const clubDelegate1Map = new Map(
      clubDelegates
        .filter(
          delegate => delegate.clubDelegateEnum === ClubDelegateEnum.Delegate1,
        )
        .map(c => [c.club.id, c]),
    );
    const clubDelegate2Map = new Map(
      clubDelegates
        .filter(
          delegate => delegate.clubDelegateEnum === ClubDelegateEnum.Delegate2,
        )
        .map(c => [c.club.id, c]),
    );
    const studentMap = new Map(students.map(s => [s.id, s]));
    const professorMap = new Map(professors.map(p => [p.id, p]));

    const joinedClubs = clubs
      .filter(e => clubSemesterMap.get(e.id) !== undefined)
      .map(club => {
        if (
          !clubRepresentativeMap.has(club.id) ||
          !clubSemesterMap.has(club.id) ||
          !clubDivisionMap.has(club.id)
        ) {
          throw new Error(
            `Club Important Data Not Found ${club.id} \n clubSemester: ${JSON.stringify(
              clubSemesterMap.get(club.id),
            )} \n clubDivision: ${JSON.stringify(clubDivisionMap.get(club.id))} \n clubRepresentative: ${JSON.stringify(
              clubRepresentativeMap.get(club.id),
            )}`,
          );
        }
        const clubRepresentative = {
          ...clubRepresentativeMap.get(club.id),
          student: studentMap.get(
            clubRepresentativeMap.get(club.id).student.id,
          ),
        };
        const clubDelegate1 = clubDelegate1Map.has(club.id)
          ? {
              ...clubDelegate1Map.get(club.id),
              student: studentMap.get(clubDelegate1Map.get(club.id).student.id),
            }
          : undefined;
        const clubDelegate2 = clubDelegate2Map.has(club.id)
          ? {
              ...clubDelegate2Map.get(club.id),
              student: studentMap.get(clubDelegate2Map.get(club.id).student.id),
            }
          : undefined;
        // console.log(
        //   `club: ${JSON.stringify(club)} \n clubSemester: ${JSON.stringify(
        //     clubSemesterMap.get(club.id),
        //   )} \n clubDivision: ${JSON.stringify(clubDivisionMap.get(club.id))}`,
        // );
        return {
          ...club,
          semester: clubSemesterMap.get(club.id),
          division: divisionMap.get(clubDivisionMap.get(club.id)?.division.id),
          clubTypeEnum: clubSemesterMap.get(club.id).clubTypeEnum,
          characteristicKr: clubSemesterMap.get(club.id).characteristicKr,
          characteristicEn: clubSemesterMap.get(club.id).characteristicEn,

          clubRepresentative: {
            studentId: clubRepresentative.student.id,
            name: clubRepresentative.student.name,
            studentNumber: clubRepresentative.student.studentNumber,
            email: clubRepresentative.student.email,
            phoneNumber: clubRepresentative.student.phoneNumber,
            clubDelegateEnum: clubRepresentative.clubDelegateEnum,
            startTerm: clubRepresentative.startTerm,
            endTerm: clubRepresentative.endTerm,
          },
          clubDelegate1: clubDelegate1
            ? {
                studentId: clubDelegate1.student.id,
                name: clubDelegate1.student.name,
                studentNumber: clubDelegate1.student.studentNumber,
                email: clubDelegate1.student.email,
                phoneNumber: clubDelegate1.student.phoneNumber,
                clubDelegateEnum: clubDelegate1.clubDelegateEnum,
                startTerm: clubDelegate1.startTerm,
                endTerm: clubDelegate1.endTerm,
              }
            : undefined,
          clubDelegate2: clubDelegate2
            ? {
                studentId: clubDelegate2.student.id,
                name: clubDelegate2.student.name,
                studentNumber: clubDelegate2.student.studentNumber,
                email: clubDelegate2.student.email,
                phoneNumber: clubDelegate2.student.phoneNumber,
                clubDelegateEnum: clubDelegate2.clubDelegateEnum,
                startTerm: clubDelegate2.startTerm,
                endTerm: clubDelegate2.endTerm,
              }
            : undefined,
          professor: professorMap.get(
            clubSemesterMap.get(club.id).professor.id,
          ),
        };
      });

    return joinedClubs;
  }

  /**
   * @param studentId 학생 id
   * @param clubId 동아리 id
   * @returns void
   * 학생이 현재 해당 동아리의 대표자 또는 대의원인지 확인합니다.
   * 학생이 현재 해당 동아리의 대표자 또는 대의원이 아닌 경우 403 exception을 throw 합니다.
   */
  async checkIsStudentDelegate(query: {
    studentId: number;
    clubId: number;
  }): Promise<void> {
    const isDelegate = await this.clubDelegateRepository.count({
      studentId: query.studentId,
      clubId: query.clubId,
      date: new Date(),
    });
    if (isDelegate === 0) {
      throw new Error(
        `Student ${query.studentId} is not a delegate of club: ${query.clubId}`,
      );
    }
  }

  /**
   * @param professorId 교수 id
   * @param clubId 동아리 id
   * @returns void
   * 교수가 현재 해당 동아리의 교수인지 확인합니다.
   * 교수가 현재 해당 동아리의 교수가 아닌 경우 403 exception을 throw 합니다.
   */
  async checkIsProfessor(query: {
    professorId: number;
    clubId: number;
    date?: Date;
  }): Promise<void> {
    const semesterId = await this.semesterPublicService.loadId({
      date: query.date,
    });
    const isProfessor = await this.clubSemesterRepository.count({
      professorId: query.professorId,
      clubId: query.clubId,
      semesterId,
    });
    if (isProfessor === 0) {
      throw new Error(
        `Professor ${query.professorId} is not a professor of club: ${query.clubId}`,
      );
    }
  }
}
