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
    date: new Date("1971.1.1"),
    patchNoteContent: "아주 오래된 패치노트.",
  },
];

export default patchNoteList;
