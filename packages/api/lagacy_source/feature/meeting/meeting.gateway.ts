import { Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

import { env } from "@sparcs-clubs/api/env";

import { MeetingService } from "./meeting.service";

interface EntryPayload {
  userId: number;
  meetingId: number;
}

interface VotePayload {
  userId: number;
  choiceId: number;
  voteId: number;
}

interface VoteResult {
  choiceId: number;
  choiceCount: number;
}

// TODO:  출석 db insert, delete 후에 class people Count 업데이트 되게 끔 변경하기
// TODO:   ===>( 아니면 이런게 가능한지 찾아보기?) ㅣ 저장해 놓고 나중에 한꺼번에 insert
// TODO:  소켓 auth 구현하기
// TODO:  payload 에서 보내주는 userId 를  client.handshake.query.userId 에서 꺼내도록 수정해야함.
const corsOrigin = env.NODE_ENV === "local" ? "*" : ["*"]; // TODO: production일 경우에 도메인 제한 필요함.
@WebSocketGateway({ namespace: "meeting", cors: corsOrigin })
export class MeetingGateway {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(MeetingGateway.name);

  constructor(private readonly meetingService: MeetingService) {}

  private peopleCount: { [meetingId: number]: Set<number> } = {};

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Remove the user from all meetings they were part of
    // eslint-disable-next-line no-restricted-syntax
    for (const meetingId in this.peopleCount) {
      if (Object.prototype.hasOwnProperty.call(this.peopleCount, meetingId)) {
        this.peopleCount[meetingId].delete(Number());
        this.server.to(meetingId.toString()).emit("exit-success", {
          meetingId: Number(meetingId),
          peopleCount: this.peopleCount[meetingId].size,
        });
      }
    }
  }

  @SubscribeMessage("entry")
  handleEntry(
    @MessageBody() payload: EntryPayload,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log("🚀 ~ MeetingGateway ~ handleEntry ~ payload:", payload);

    const { userId, meetingId } = payload;

    client.join(meetingId.toString());
    // console.log("🚀 ~ MeetingGateway ~ handleEntry ~ meetingId:", userId,  meetingId)

    if (!this.peopleCount[meetingId]) {
      this.peopleCount[meetingId] = new Set();
    }

    this.peopleCount[meetingId].add(userId);

    this.server.to(meetingId.toString()).emit("entry-success", {
      meetingId,
      peopleCount: this.peopleCount[meetingId].size,
    });
  }

  @SubscribeMessage("exit")
  handleExit(
    @MessageBody() payload: EntryPayload,
    @ConnectedSocket() client: Socket,
  ): void {
    const { userId, meetingId } = payload;
    client.leave(meetingId.toString());

    if (this.peopleCount[meetingId]) {
      this.peopleCount[meetingId].delete(userId);
    }
    this.server.to(meetingId.toString()).emit("exit-success", {
      meetingId,
      peopleCount: this.peopleCount[meetingId].size,
    });
  }

  @SubscribeMessage("vote")
  handleVote(
    @MessageBody() payload: VotePayload,
    @ConnectedSocket() client: Socket,
  ): void {
    const { voteId } = payload;

    // Here we should handle the vote logic, e.g., update the vote count in the database

    // For simplicity, assume the vote result is returned as below:
    // const result1 =
    const result: VoteResult[] = [
      { choiceId: 1, choiceCount: 10 },
      { choiceId: 2, choiceCount: 20 },
    ];

    this.server.to(voteId.toString()).emit("vote-success", {
      voteId,
      result,
    });

    client.emit("my-vote-success", {
      voteId,
      success: true,
    });
  }
}
