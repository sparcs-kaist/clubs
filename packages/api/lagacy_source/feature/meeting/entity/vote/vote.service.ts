import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import { VoteRepository } from "./vote.repository";

@Injectable()
export class VoteService {
  constructor(
    private readonly voteRepository: VoteRepository,
    private readonly userPublicService: UserPublicService,
  ) {}

  async postExecutiveMeetingAgendaVote(
    executiveId: number,
    meetingId: number,
    agendaId: number,
    title: string,
    description: string,
    choices: Array<{ id: number; choice: string }>,
  ) {
    const executive = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!executive) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }

    const result = await this.voteRepository.postMeetingAgendaVote(
      executiveId,
      meetingId,
      agendaId,
      title,
      description,
      choices,
    );
    if (!result) {
      throw new HttpException("Failed to create vote", HttpStatus.BAD_REQUEST);
    }
    return result;
  }

  async postExecutiveMeetingAgendaVoteResult(
    executiveId: number,
    meetingId: number,
    agendaId: number,
    voteId: number,
    choiceId: number,
  ) {
    const executive = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!executive) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }

    const result = await this.voteRepository.postMeetingAgendaVoteResult(
      executiveId,
      meetingId,
      agendaId,
      voteId,
      choiceId,
    );
    if (!result) {
      throw new HttpException(
        "Failed to create vote result",
        HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }

  async putExecutiveMeetingAgendaVote(
    executiveId: number,
    meetingId: number,
    agendaId: number,
    voteId: number,
    title: string,
    description: string,
  ) {
    const executive = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!executive) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }

    const result = await this.voteRepository.putMeetingAgendaVote(
      executiveId,
      meetingId,
      agendaId,
      voteId,
      title,
      description,
    );
    if (!result) {
      throw new HttpException("Failed to modify vote", HttpStatus.BAD_REQUEST);
    }
    return result;
  }

  async putExecutiveMeetingAgendaVoteChoices(
    executiveId: number,
    meetingId: number,
    agendaId: number,
    voteId: number,
    choices: Array<{ id: number; choice: string }>,
  ) {
    const executive = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!executive) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }

    const result = await this.voteRepository.putMeetingAgendaVoteChoices(
      executiveId,
      meetingId,
      agendaId,
      voteId,
      choices,
    );
    if (!result) {
      throw new HttpException(
        "Failed to modify vote choices",
        HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }

  async putExecutiveMeetingAgendaVoteUserChoice(
    executiveId: number,
    meetingId: number,
    agendaId: number,
    voteId: number,
    choiceId: number,
  ) {
    const executive = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!executive) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }

    const result = await this.voteRepository.putMeetingAgendaVoteUserChoice(
      executiveId,
      meetingId,
      agendaId,
      voteId,
      choiceId,
    );
    if (!result) {
      throw new HttpException(
        "Failed to modify user's vote choice",
        HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }

  async deleteExecutiveMeetingAgendaVote(
    executiveId: number,
    meetingId: number,
    agendaId: number,
    voteId: number,
  ) {
    const executive = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!executive) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }

    const result = await this.voteRepository.deleteMeetingAgendaVote(
      executiveId,
      meetingId,
      agendaId,
      voteId,
    );
    if (!result) {
      throw new HttpException("Failed to delete vote", HttpStatus.BAD_REQUEST);
    }
    return result;
  }

  async deleteExecutiveMeetingAgendaVoteForUser(
    executiveId: number,
    meetingId: number,
    agendaId: number,
    voteId: number,
  ) {
    const executive = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!executive) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }

    const result = await this.voteRepository.deleteMeetingAgendaVoteForUser(
      executiveId,
      meetingId,
      agendaId,
      voteId,
    );
    if (!result) {
      throw new HttpException(
        "Failed to delete vote for user",
        HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }

  // CHACHA: 투표와 관련한 모든 정보 가져오기
  async getExecutiveMeetingAgendaVote(
    executiveId: number,
    meetingId: number,
    agendaId: number,
    voteId: number,
  ) {
    const executive = await this.userPublicService.getExecutiveById({
      id: executiveId,
    });

    if (!executive) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }

    const result = await this.voteRepository.getMeetingAgendaVote(
      executiveId,
      meetingId,
      agendaId,
      voteId,
    );
    if (!result) {
      throw new HttpException("Failed get vote", HttpStatus.BAD_REQUEST);
    }
    return result;
  }
}
