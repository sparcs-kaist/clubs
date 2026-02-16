import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class ClubPutStudentClubBrief {
  constructor(private readonly prisma: PrismaService) {}

  async putStudentClubBrief(
    clubId: number,
    description: string,
    roomPassword: string,
  ): Promise<boolean> {
    const crt = new Date();
    await this.prisma.$transaction(async tx => {
      // This is a complex multi-table UPDATE with JOINs - preserve as raw SQL
      const result = await tx.$executeRaw(Prisma.sql`
        UPDATE club_t ct
        LEFT JOIN club c ON (ct.club_id = c.id AND (c.deleted_at IS NULL))
        LEFT JOIN club_room_t crt ON
          (ct.club_id = crt.club_id AND
            (
              (crt.end_term IS NULL AND crt.start_term <= ${crt})
              OR (crt.end_term >= ${crt})
            )
          )
        SET c.description = ${description}, crt.room_password = ${roomPassword}
        WHERE (ct.club_id = ${clubId}
        AND ((ct.end_term IS NULL AND ct.start_term <= ${crt})
        OR (ct.end_term >= ${crt})))
      `);
      if (result !== 1) {
        throw new Error("putStudentClubBrief failed");
      }
    });
    return true;
  }
}
