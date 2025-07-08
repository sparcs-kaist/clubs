import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { ApiMee006ResponseCreated } from "@clubs/interface/api/meeting/apiMee006";
import {
  ApiMee007RequestParam,
  ApiMee007ResponseCreated,
} from "@clubs/interface/api/meeting/apiMee007";
import { ApiMee008ResponseOk } from "@clubs/interface/api/meeting/apiMee008";
import {
  ApiMee009RequestBody,
  ApiMee009RequestParam,
  ApiMee009ResponseCreated,
} from "@clubs/interface/api/meeting/apiMee009";
import {
  ApiMee010RequestParam,
  ApiMee010ResponseOk,
} from "@clubs/interface/api/meeting/apiMee010";
import {
  ApiMee011RequestParam,
  ApiMee011ResponseCreated,
} from "@clubs/interface/api/meeting/apiMee011";

import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import { MeetingRepository } from "../meeting.repository";

@Injectable()
export class AgendaService {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly userPublicService: UserPublicService,
  ) {}

  async postExecutiveMeetingAgenda(
    executiveId: number,
    meetingId: number,
    meetingEnumId: number,
    description: string,
    title: string,
  ): Promise<ApiMee006ResponseCreated> {
    const user = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!user) {
      throw new UnauthorizedException("Not allowed type");
    }

    await this.meetingRepository.insertMeetingAgendaAndMapping(
      meetingId,
      meetingEnumId,
      description,
      title,
    );

    return {};
  }

  async getMeetingAgendas(
    param: ApiMee007RequestParam,
  ): Promise<ApiMee007ResponseCreated> {
    const res = await this.meetingRepository.getMeetingAgendas(param.meetingId);
    return res;
  }

  async patchExecutiveMeetingAgenda(
    executiveId: number,
    agendaId: number,
    agendaEnumId: number,
    description: string,
    title: string,
  ): Promise<ApiMee008ResponseOk> {
    const user = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!user) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }

    await this.meetingRepository.updateMeetingAgenda(
      agendaId,
      agendaEnumId,
      description,
      title,
    );

    return {};
  }

  async patchExecutiveMeetingAgendasOrder(
    executiveId: number,
    param: ApiMee009RequestParam,
    body: ApiMee009RequestBody,
  ): Promise<ApiMee009ResponseCreated> {
    const user = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!user) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }

    await this.meetingRepository.updateMeetingAgendasOrder(
      param.meetingId,
      body.agendaIdList,
    );

    return {};
  }

  async deleteExecutiveMeetingAgenda(
    executiveId: number,
    param: ApiMee010RequestParam,
  ): Promise<ApiMee010ResponseOk> {
    const user = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!user) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }

    await this.meetingRepository.deleteMeetingAgendaMapping(
      param.meetingId,
      param.agendaId,
    );

    return {};
  }

  async postExecutiveMeetingAgendaImport(
    executiveId: number,
    param: ApiMee011RequestParam,
  ): Promise<ApiMee011ResponseCreated> {
    const user = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!user) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }

    await this.meetingRepository.addMeetingAgendaMapping(
      param.meetingId,
      param.agendaId,
    );

    return {};
  }
}
