import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("operation_committee", { schema: "sparcs-clubs" })
export class OperationCommittee {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("text", { name: "secret_key" })
  secretKey: string;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;
}
