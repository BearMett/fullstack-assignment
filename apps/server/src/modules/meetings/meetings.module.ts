import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Application, Meeting } from "../../entity";
import { AuthModule } from "../auth/auth.module";
import { MeetingsController } from "./meetings.controller";
import { MeetingsService } from "./meetings.service";

@Module({
  imports: [TypeOrmModule.forFeature([Meeting, Application]), AuthModule],
  controllers: [MeetingsController],
  providers: [MeetingsService],
})
export class MeetingsModule {}
