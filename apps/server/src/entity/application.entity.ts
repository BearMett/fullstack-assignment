import { ApplicationStatus } from "@packages/shared";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Meeting } from "./meeting.entity";
import { User } from "./user.entity";

@Entity("application")
@Unique(["userId", "meetingId"])
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "integer" })
  userId: number;

  @Column({ type: "integer" })
  meetingId: number;

  @Column({ type: "simple-enum", enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  status: ApplicationStatus;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.applications, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Meeting, (meeting) => meeting.applications, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "meetingId" })
  meeting: Meeting;
}
