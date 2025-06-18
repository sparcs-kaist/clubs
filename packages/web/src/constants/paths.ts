/**
 * @file   paths.ts
 * @brief  Path constants for Navigate, Link, and other components that require paths to be defined as constants.
 * @author andy@sparcs.org (Sangwoo Ye)
 */

const externalLinks = {
  allClubRepresentativeMeeting:
    "https://cafe.naver.com/ArticleList.nhn?search.clubid=26985838&search.menuid=14&search.boardtype=L",
  expandedOperatingCommittee:
    "https://cafe.naver.com/ArticleList.nhn?search.clubid=26985838&search.menuid=41&search.boardtype=L",
  operatingCommittee:
    "https://cafe.naver.com/ArticleList.nhn?search.clubid=26985838&search.menuid=13&search.boardtype=L",
  divisionMeeting:
    "https://cafe.naver.com/ArticleList.nhn?search.clubid=26985838&search.menuid=16&search.boardtype=L",
  kakaotalk: "https://pf.kakao.com/_zpxaSd/chat",
  rules:
    "https://cafe.naver.com/ArticleList.nhn?search.clubid=26985838&search.menuid=19&search.boardtype=L",
};

/**
 * NOTE: (@dora)
 * - production 배포 준비된 페이지들을 따로 관리
 * - 여기 없는 페이지들은 dev mode에서만 접근 가능
 * */
export const productionReadyPaths: {
  exact: string[];
  startsWith: string[];
  exclude: string[];
} = {
  exact: [
    // 공통
    "/",
    // 마이페이지
    "/my",
    // 대표 동아리 관리
    "/manage-club",
  ],
  startsWith: [
    // 공통
    "/clubs",
    "/notice",
    "/credits",
    "/errors/not-iam-login",
    // 마이페이지
    "/my/clubs",
    // 대표 동아리 관리
    "/manage-club/members",
    // 활동 보고서
    "/manage-club/activity-report",
    "/executive/activity-report",
    // 지원금
    "/manage-club/funding",
    "/executive/funding",
    // 동아리 / 회원 등록
    "/register-club",
    "/my/register-club",
    "/executive/register-club",
    "/executive/register-member",
    // 상임동아리 대표자 대시보드
    "/manage-club/permanent",
    // 동아리 등록 신청 내역
    "/club-registration",
    // 동아리 총람
    "/overview",
  ],
  exclude: [],
};

// authority가 "all"을 포함하면 권한 상관 없이 보이는 메뉴
const paths = {
  HOME: { name: "홈", path: "/", featureFlag: "DEFAULT", authority: ["all"] },
  NOTICE: {
    name: "path.공지사항",
    path: "/notice",
    authority: ["all"],
    featureFlag: "DEFAULT",
  },
  CLUBS: {
    name: "path.동아리",
    featureFlag: "DEFAULT",
    sub: [
      {
        name: "path.동아리 목록",
        path: "/clubs",
        authority: ["all"],
        featureFlag: "DEFAULT",
      },
      {
        name: "path.나의 동아리",
        path: "/my/clubs",
        authority: ["all"],
        featureFlag: "DEFAULT",
      },
      {
        name: "path.동아리 등록 신청",
        path: "/register-club",
        authority: ["all"],
        featureFlag: "REGISTER_CLUB",
      },
      {
        name: "path.대표 동아리 관리",
        path: "/manage-club",
        authority: ["all"],
        featureFlag: "DEFAULT",
      },
    ],
    authority: ["all"],
  },
  VOTING: {
    name: "path.의결기구",
    featureFlag: "DEFAULT",
    sub: [
      // {
      //   name: "최근 회의",
      //   path: "/meeting",
      //   featureFlag: "DEFAULT",
      // },
      {
        name: "path.전동대회",
        // path: MEETING_PATH(MeetingEnum.clubRepresentativesCouncilMeeting),
        path: externalLinks.allClubRepresentativeMeeting,
        authority: ["all"],
        featureFlag: "DEFAULT",
      },
      {
        name: "path.확대운영위원회",
        // path: MEETING_PATH(MeetingEnum.expansiveOperativeCommittee),
        path: externalLinks.expandedOperatingCommittee,
        authority: ["all"],
        featureFlag: "DEFAULT",
      },
      {
        name: "path.운영위원회",
        // path: MEETING_PATH(MeetingEnum.operativeCommittee),
        path: externalLinks.operatingCommittee,
        authority: ["all"],
        featureFlag: "DEFAULT",
      },
      {
        name: "path.분과회의",
        // path: MEETING_PATH(MeetingEnum.divisionMeeting),
        path: externalLinks.divisionMeeting,
        authority: ["all"],
        featureFlag: "DEFAULT",
      },
    ],
    authority: ["all"],
  },
  COMMUNITY: {
    name: "path.소통",
    featureFlag: "DEFAULT",
    // TODO: 임시 링크
    sub: [
      // {
      //   name: "소통채널 안내",
      //   path: "/communication-channel",
      //   featureFlag: "NO_RELEASE",
      // },
      {
        name: "path.카카오톡 문의하기",
        path: externalLinks.kakaotalk,
        authority: ["all"],
        featureFlag: "DEFAULT",
      },
      {
        name: "path.동아리연합회칙",
        path: externalLinks.rules,
        authority: ["all"],
        featureFlag: "DEFAULT",
      },
    ],
    authority: ["all"],
  },
  SERVICE: {
    name: "path.서비스 신청",
    featureFlag: "NO_RELEASE",
    sub: [
      {
        name: "path.대여 사업",
        path: "/rental-business",
        authority: ["all"],
        featureFlag: "NO_RELEASE",
      },
      {
        name: "path.홍보물 인쇄",
        path: "/printing-business",
        authority: ["all"],
        featureFlag: "NO_RELEASE",
      },
      {
        name: "path.활동확인서 발급",
        path: "/activity-certificate",
        authority: ["all"],
        featureFlag: "NO_RELEASE",
      },
      {
        name: "path.공용공간 비정기사용",
        path: "/common-space",
        authority: ["all"],
        featureFlag: "NO_RELEASE",
      },
    ],
    authority: ["all"],
  },
  EXECUTIVE: {
    name: "path.집행부",
    featureFlag: "DEFAULT",
    sub: [
      {
        name: "path.동아리 등록 신청",
        path: "/executive/register-club",
        authority: ["executive"],
        featureFlag: "REGISTER_CLUB",
      },
      {
        name: "path.회원 등록 신청",
        path: "/executive/register-member",
        authority: ["executive"],
        featureFlag: "REGISTER_MEMBER",
      },
      {
        name: "path.활동 보고서",
        path: "/executive/activity-report",
        authority: ["executive"],
        featureFlag: "DEFAULT",
      },
      {
        name: "path.지원금",
        path: "/executive/funding",
        authority: ["executive"],
        featureFlag: "DEFAULT",
      },
    ],
    authority: ["executive"],
  },
  // TODO: 임시 링크
  MADE_BY: {
    name: "path.만든 사람들",
    path: "/credits",
    featureFlag: "DEFAULT",
    authority: ["executive"],
  },
  LICENSE: {
    name: "path.라이센스",
    path: "/",
    featureFlag: "DEFAULT",
    authority: ["executive"],
  },
  TERMS_OF_SERVICE: {
    name: "path.이용 약관",
    path: "/",
    featureFlag: "DEFAULT",
    authority: ["executive"],
  },
  LOGIN: {
    name: "path.로그인",
    path: "/",
    featureFlag: "DEFAULT",
    authority: ["all"],
  }, // TODO: 아마 로그인 사라질듯?
};

export type Paths = typeof paths;

export default paths;
