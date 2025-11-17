import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Activity } from "./Activity";
import { ActivityClubChargedExecutive } from "./ActivityClubChargedExecutive";
import { ActivityFeedback } from "./ActivityFeedback";
import { ExecutiveT } from "./ExecutiveT";
import { Funding } from "./Funding";
import { FundingFeedback } from "./FundingFeedback";
import { RegistrationExecutiveComment } from "./RegistrationExecutiveComment";
import { Student } from "./Student";
import { User } from "./User";

@Index("student_id_unique", ["studentId"], { unique: true })
@Index("executive_user_id_user_id_fk", ["userId"], {})
@Entity("executive", { schema: "sparcs-clubs" })
export class Executive {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "user_id", nullable: true })
  userId: number | null;

  @Column("int", { name: "student_id", unique: true })
  studentId: number;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("varchar", { name: "email", nullable: true, length: 255 })
  email: string | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Activity, activity => activity.chargedExecutive, {
    lazy: true,
  })
  activities: Promise<Activity[]>;

  @OneToMany(() => Activity, activity => activity.chargedExecutive_2, {
    lazy: true,
  })
  activities2: Promise<Activity[]>;

  @OneToMany(() => Activity, activity => activity.commentedExecutive, {
    lazy: true,
  })
  activities3: Promise<Activity[]>;

  @OneToMany(
    () => ActivityClubChargedExecutive,
    activityClubChargedExecutive => activityClubChargedExecutive.executive,
    { lazy: true },
  )
  activityClubChargedExecutives: Promise<ActivityClubChargedExecutive[]>;

  @OneToMany(
    () => ActivityFeedback,
    activityFeedback => activityFeedback.executive,
    { lazy: true },
  )
  activityFeedbacks: Promise<ActivityFeedback[]>;

  @OneToOne(() => Student, student => student.executive, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "student_id", referencedColumnName: "id" }])
  student: Promise<Student>;

  @ManyToOne(() => User, user => user.executives, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Promise<User>;

  @OneToMany(() => ExecutiveT, executiveT => executiveT.executive, {
    lazy: true,
  })
  executiveTs: Promise<ExecutiveT[]>;

  @OneToMany(() => Funding, funding => funding.chargedExecutive, {
    lazy: true,
  })
  fundings: Promise<Funding[]>;

  @OneToMany(
    () => FundingFeedback,
    fundingFeedback => fundingFeedback.executive,
    { lazy: true },
  )
  fundingFeedbacks: Promise<FundingFeedback[]>;

  @OneToMany(
    () => RegistrationExecutiveComment,
    registrationExecutiveComment => registrationExecutiveComment.executive,
    { lazy: true },
  )
  registrationExecutiveComments: Promise<RegistrationExecutiveComment[]>;
}
