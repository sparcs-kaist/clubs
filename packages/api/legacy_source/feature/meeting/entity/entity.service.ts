import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

// import { WsException } from "@nestjs/websockets";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import { EntityRepository } from "./entity.repository";

@Injectable()
export class EntityService {
  constructor(
    private readonly entityRepository: EntityRepository,
    private readonly userPublicService: UserPublicService,
  ) {}

  async putExecutiveMeetingAgendaEntities(
    executiveId: number,
    meetingId: number,
    agendaId: number,
    entityIdList: Array<{ id: number; meetingAgendaEntityType: number }>,
  ) {
    const executive = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!executive) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }

    const result = await this.entityRepository.putMeetingAgendaEntities(
      executiveId,
      meetingId,
      agendaId,
      entityIdList,
    );
    if (!result) {
      throw new HttpException(
        "Failed to modify entity position",
        HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }

  async getExecutiveMeetingAgendaEntities(
    executiveId: number,
    meetingId: number,
    agendaId: number,
  ) {
    const executive = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!executive) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }

    const result = await this.entityRepository.getMeetingAgendaEntities(
      executiveId,
      meetingId,
      agendaId,
    );
    if (!result) {
      throw new HttpException(
        "Failed get meeting agenda entities",
        HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }
}
