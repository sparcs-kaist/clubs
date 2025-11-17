import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Executive } from "./Executive";
import { ExecutiveBureauEnum } from "./ExecutiveBureauEnum";
import { ExecutiveStatusEnum } from "./ExecutiveStatusEnum";

@Index(
  "executive_t_executive_id_start_term_unique_key",
  ["executiveId", "startTerm"],
  { unique: true },
)
@Index(
  "executive_t_executive_status_enum_executive_status_enum_id_fk",
  ["executiveStatusEnum"],
  {},
)
@Index(
  "executive_t_executive_bureau_enum_executive_bureau_enum_id_fk",
  ["executiveBureauEnum"],
  {},
)
@Entity("executive_t", { schema: "sparcs-clubs" })
export class ExecutiveT {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "executive_id" })
  executiveId: number;

  @Column("int", { name: "executive_status_enum" })
  executiveStatusEnum: number;

  @Column("int", { name: "executive_bureau_enum" })
  executiveBureauEnum: number;

  @Column("date", { name: "start_term" })
  startTerm: string;

  @Column("date", { name: "end_term", nullable: true })
  endTerm: string | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(
    () => ExecutiveBureauEnum,
    executiveBureauEnum => executiveBureauEnum.executiveTs,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "executive_bureau_enum", referencedColumnName: "id" }])
  executiveBureauEnum2: Promise<ExecutiveBureauEnum>;

  @ManyToOne(() => Executive, executive => executive.executiveTs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "executive_id", referencedColumnName: "id" }])
  executive: Promise<Executive>;

  @ManyToOne(
    () => ExecutiveStatusEnum,
    executiveStatusEnum => executiveStatusEnum.executiveTs,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "executive_status_enum", referencedColumnName: "id" }])
  executiveStatusEnum2: Promise<ExecutiveStatusEnum>;
}
