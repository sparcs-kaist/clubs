export interface patchNote {
  version: string;
  date: Date;
  patchNoteContent: string;
}

const patchNoteList: patchNote[] = [
  {
    version: "v.0.0.80",
    date: new Date("2025.07.08"),
    patchNoteContent: `Clubs v0.0.80
오류 수정은 다음과 같습니다.
- 집행부원별 활동보고서 처리현황에서 중복된 활동보고서가 표시되면 문제가 해결되었습니다.
`,
  },
  {
    version: "v.0.0.79",
    date: new Date("2025.07.02"),
    patchNoteContent: `Clubs v0.0.79
오류 수정은 다음과 같습니다.
- 활동보고서의 담당 집행부원 변경시, 하나의 동아리를 선택하면 오류가 발생하던 버그가 수정되었습니다.
디자인 수정은 다음과 같습니다.
- 동아리별 활동보고서 조회 페이지 마진이 조정되었습니다.
`,
  },
  {
    version: "v.0.0.78",
    date: new Date("2025.07.01"),
    patchNoteContent: `Clubs v0.0.78
오류 수정은 다음과 같습니다.
- 일부 교수님들께서 학생으로 로그인되거나, 로그인되지 않는 버그가 수정되었습니다.
`,
  },
  {
    version: "v.0.0.77",
    date: new Date("2025.06.29"),
    patchNoteContent: `Clubs v0.0.77
오류 수정은 다음과 같습니다.
- 집행부원이 활동보고서를 조회할 때, 임기가 지난 집행부원이 담당한 활동보고서를 조회할 수 없던 버그가 수정되었습니다.
- 활동보고서 작성시, 활동기간을 4개 입력할 때 달력이 제대로 선택되지 않던 버그가 수정되었습니다.
`,
  },
  {
    version: "v.0.0.76",
    date: new Date("2025.06.20"),
    patchNoteContent: `Clubs v0.0.76
오류 수정은 다음과 같습니다.
- 활동보고서 수정시 지도교수님께서 승인한 것처럼 보이는 버그가 수정되었습니다.
`,
  },
  {
    version: "v.0.0.75",
    date: new Date("2025.06.17"),
    patchNoteContent: `Clubs v0.0.75
Clubs 신규 기능은은 다음과 같습니다.
- 패치노트: 신규 버전 업데이트시 1회 업데이트 내용을 패치노트로 안내드립니다.
- 지원금 임시저장 기능 추가: 지원금 신청 작성시 임시저장 기능을 제공합니다. 활동보고서와 동일한 임시저장 기능입니다.
오류 수정은 다음과 같습니다.
- 공지사항이 게시 시간과 다르게 정렬되는 버그가 수정되었습니다.
- 일부 교수님들께서 로그인이 되지 않는 버그가 수정되었습니다.
`,
  },
  {
    version: "v.0.0.1",
    date: new Date("1971.2.16"),
    patchNoteContent: "클럽스는 스팍스 탄생 전부터 존재했다 - Hama",
  },
];

export default patchNoteList;
