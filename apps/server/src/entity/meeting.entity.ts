import { MeetingCategory } from "@packages/shared";
import { Application } from "./application.entity";
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("meeting")
@Check('"maxParticipants" >= 1')
export class Meeting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: "simple-enum", enum: MeetingCategory })
  category: MeetingCategory;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "integer" })
  maxParticipants: number;

  @Column({ type: "datetime" })
  deadline: string;

  @Column({ type: "datetime" })
  announcement: string;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt: Date;

  @OneToMany(() => Application, (application) => application.meeting)
  applications: Application[];
}
