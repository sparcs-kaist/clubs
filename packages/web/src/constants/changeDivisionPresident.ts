export enum ChangeDivisionPresidentStatusEnum {
  Requested = 1,
  Canceled,
  Rejected,
  Confirmed,
  None,
}

type Pages = "/my" | "/manage-division";

interface ChangeDivisionPresidentMessageContextProps {
  actingPresident: boolean;
  division: string;
  status: Exclude<
    ChangeDivisionPresidentStatusEnum,
    ChangeDivisionPresidentStatusEnum.None
  >;
  page: Pages;
  change?: [string, string];
  isModal: boolean;
}

export class ChangeDivisionPresidentMessageContext {
  actingPresident: boolean;

  division: string;

  status: Exclude<
    ChangeDivisionPresidentStatusEnum,
    ChangeDivisionPresidentStatusEnum.None
  >;

  page: Pages;

  change?: [string, string];

  isModal: boolean;

  constructor({
    actingPresident,
    division,
    status,
    page,
    change,
    isModal,
  }: ChangeDivisionPresidentMessageContextProps) {
    this.actingPresident = actingPresident;
    this.division = division;
    this.status = status;
    this.page = page;
    this.change = change;
    this.isModal = isModal;
  }

  public getHeader(): string {
    return this.page === "/my"
      ? `분과 ${this.getPronoun()} 변경 ${this.getStatus()}`
      : `분과 ${this.getPronoun()} 변경 요청 ${this.getStatus()}`;
  }

  public getBody(): string {
    const manageDivisionPageInner = {
      [ChangeDivisionPresidentStatusEnum.Requested]: ` 변경이 다음과 같이 요청되었습니다 `,
      [ChangeDivisionPresidentStatusEnum.Canceled]: ` 변경이 취소되었습니다`,
      [ChangeDivisionPresidentStatusEnum.Rejected]: ` 변경 요청이 거절되었습니다 `,
      [ChangeDivisionPresidentStatusEnum.Confirmed]: "error",
    };

    const innerMessage =
      this.page === "/my"
        ? ` 변경이 다음과 같이 ${this.getStatus()}되었습니다 `
        : manageDivisionPageInner[this.status];

    return `${this.getFullPronoun()}${innerMessage}${
      this.status === ChangeDivisionPresidentStatusEnum.Canceled &&
      this.page === "/manage-division"
        ? ""
        : this.getChange()
    }${
      this.status === ChangeDivisionPresidentStatusEnum.Requested &&
      this.page === "/my" &&
      !this.isModal
        ? " (승인 전)"
        : ""
    }`;
  }

  public getRequestNotice(): string {
    if (
      this.page === "/manage-division" &&
      this.status === ChangeDivisionPresidentStatusEnum.Requested
    ) {
      return `${this.getPronoun()} 변경 요청을 취소할 수 있으며, 요청이 3일 내로 승인 또는 거절되지 않을 경우 자동으로 취소됩니다`;
    }

    return "error";
  }

  private getStatus() {
    const myPageStatus = {
      [ChangeDivisionPresidentStatusEnum.Requested]: "요청",
      [ChangeDivisionPresidentStatusEnum.Confirmed]: "완료",
      [ChangeDivisionPresidentStatusEnum.Canceled]: "error",
      [ChangeDivisionPresidentStatusEnum.Rejected]: "error",
    };

    const manageDivisionPageStatus = {
      [ChangeDivisionPresidentStatusEnum.Requested]: "완료",
      [ChangeDivisionPresidentStatusEnum.Canceled]: "취소",
      [ChangeDivisionPresidentStatusEnum.Rejected]: "거절",
      [ChangeDivisionPresidentStatusEnum.Confirmed]: "error",
    };

    return (this.page === "/my" ? myPageStatus : manageDivisionPageStatus)[
      this.status
    ];
  }

  private getPronoun() {
    return this.actingPresident ? "학생회장 권한대행" : "학생회장";
  }

  private getFullPronoun() {
    return `${this.division}의 ${this.getPronoun()}`;
  }

  private getChange() {
    return this.change === undefined
      ? "error"
      : `\n${this.change[0]} -> ${this.change[1]}`;
  }
}
