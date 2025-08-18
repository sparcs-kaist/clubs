import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";

import UserPublicService from "../user/service/user.public.service";
import { MeetingRepository } from "./meeting.repository";

@Injectable()
export class MeetingService {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly userPublicService: UserPublicService,
  ) {}

  async entryMeeting(meetingId: number, userId: number) {
    const result = await this.meetingRepository.entryMeeting(meetingId, userId);
    if (!result) {
      throw new WsException("Failed to entry meeting");
    }
    return result;
  }

  async exitMeeting(meetingId: number, userId: number) {
    const result = await this.meetingRepository.exitMeeting(meetingId, userId);
    if (!result) {
      throw new WsException("Failed to exit meeting");
    }
    return result;
  }

  async vote(choiceId: number, userId: number, voteId: number) {
    const result = await this.meetingRepository.vote(choiceId, userId, voteId);
    if (!result) {
      throw new WsException("Failed to exit meeting");
    }
    return result;
  }

  async getExecutiveMeetingNextDegree(
    query: { meetingEnumId: number },
    executiveId: number,
  ) {
    // TODO: 국장단 여부 확인
    const user = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!user) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }

    const result =
      await this.meetingRepository.selectExecutiveMeetingNextDegree(query);

    return result;
  }
}
