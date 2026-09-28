export const AgendaTypeEnum = {
  Report: 1, // 보고안건
  Discuss: 2, // 논의안건
  Deliberation: 3, // 심의안건
  Approval: 4, // 인준안건
  Special: 5, // 특별안건
} as const;

export type AgendaTypeEnum =
  (typeof AgendaTypeEnum)[keyof typeof AgendaTypeEnum];

export const AgendaTypeName = {
  [AgendaTypeEnum.Report]: "보고안건",
  [AgendaTypeEnum.Discuss]: "논의안건",
  [AgendaTypeEnum.Deliberation]: "심의안건",
  [AgendaTypeEnum.Approval]: "인준안건",
  [AgendaTypeEnum.Special]: "특별안건",
};
