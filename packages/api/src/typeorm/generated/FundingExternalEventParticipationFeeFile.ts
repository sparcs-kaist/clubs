import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Funding } from "./Funding";

@Index("external_event_participation_fee_file_funding_id_fk", ["fundingId"], {})
@Entity("funding_external_event_participation_fee_file", {
  schema: "sparcs-clubs",
})
export class FundingExternalEventParticipationFeeFile {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "funding_id" })
  fundingId: number;

  @Column("varchar", { name: "file_id", length: 128 })
  fileId: string;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(
    () => Funding,
    funding => funding.fundingExternalEventParticipationFeeFiles,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "funding_id", referencedColumnName: "id" }])
  funding: Promise<Funding>;
}
