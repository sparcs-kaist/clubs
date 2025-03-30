import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import type { ApiNtc001ResponseOK } from "@sparcs-clubs/interface/api/notice/endpoint/apiNtc001";

import { NoticeRepository } from "@sparcs-clubs/api/feature/notice/repository/notice.repository";

@Injectable()
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async getNotices(pageOffset: number, itemCount: number) {
    const notices = await this.noticeRepository.find({
      pagination: {
        offset: pageOffset,
        itemCount,
      },
    });

    if (!notices) {
      throw new HttpException(
        "[NoticeService] Error occurs while getting notices",
        HttpStatus.NOT_FOUND,
      );
    }

    const serviceResponse: ApiNtc001ResponseOK = {
      notices,
      total: await this.noticeRepository.count({}),
      offset: pageOffset,
    };

    return serviceResponse;
  }
}
