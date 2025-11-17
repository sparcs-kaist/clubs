import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("notice", { schema: "sparcs-clubs" })
export class Notice {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "title", length: 255 })
  title: string;

  @Column("varchar", { name: "author", length: 30 })
  author: string;

  @Column("date", { name: "date" })
  date: string;

  @Column("varchar", { name: "link", length: 255 })
  link: string;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("int", { name: "article_id", nullable: true })
  articleId: number | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;
}
