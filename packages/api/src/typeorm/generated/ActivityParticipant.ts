import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Activity } from "./Activity";
import { Student } from "./Student";

@Index("activity_participant_activity_id_fk", ["activityId"], {})
@Index("activity_participant_student_id_fk", ["studentId"], {})
@Entity("activity_participant", { schema: "sparcs-clubs" })
export class ActivityParticipant {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "activity_id" })
  activityId: number;

  @Column("int", { name: "student_id" })
  studentId: number;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Activity, activity => activity.activityParticipants, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "activity_id", referencedColumnName: "id" }])
  activity: Promise<Activity>;

  @ManyToOne(() => Student, student => student.activityParticipants, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "student_id", referencedColumnName: "id" }])
  student: Promise<Student>;
}
