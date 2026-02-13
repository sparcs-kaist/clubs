import { Injectable } from "@nestjs/common";

import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class UserEndpointRepository {
  constructor(private readonly prisma: PrismaService) {}
}
