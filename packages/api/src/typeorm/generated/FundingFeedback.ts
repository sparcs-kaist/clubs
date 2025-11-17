import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Executive } from "./Executive";
import { Funding } from "./Funding";

@Index("funding_feedback_funding_id_fk", ["fundingId"], {})
@Index("funding_feedback_executive_id_fk", ["executiveId"], {})
@Entity("funding_feedback", { schema: "sparcs-clubs" })
export class FundingFeedback {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "funding_id" })
  fundingId: number;

  @Column("int", { name: "executive_id" })
  executiveId: number;

  @Column("text", { name: "feedback" })
  feedback: string;

  @Column("int", { name: "funding_status_enum" })
  fundingStatusEnum: number;

  @Column("int", { name: "approved_amount" })
  approvedAmount: number;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Executive, executive => executive.fundingFeedbacks, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "executive_id", referencedColumnName: "id" }])
  executive: Promise<Executive>;

  @ManyToOne(() => Funding, funding => funding.fundingFeedbacks, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "funding_id", referencedColumnName: "id" }])
  funding: Promise<Funding>;
}
