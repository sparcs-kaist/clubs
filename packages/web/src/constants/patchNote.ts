export interface patchNote {
  version: string;
  date: Date;
  patchNoteContent: string;
}

const patchNoteList: patchNote[] = [
  {
    version: "v.1.1.1",
    date: new Date("2025.1.1"),
    patchNoteContent: "패치노트 내용이 들어갑니다.",
  },
  {
    version: "v.0.0.1",
    date: new Date("1971.2.16"),
    patchNoteContent: "클럽스는 스팍스 탄생 전부터 존재했다 - Hama",
  },
];

export default patchNoteList;
