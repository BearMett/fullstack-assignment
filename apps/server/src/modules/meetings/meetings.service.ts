import { ApplicationResultType, ApplicationStatus, MeetingDetailType, MeetingListItemDto, MeetingType, UserRole } from "@packages/shared";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Application, Meeting } from "../../entity";
import { isAnnouncementPast, isRecruiting, toResultMessage } from "../meeting-utils";
import { CreateMeetingRequestDto } from "./dto/create-meeting-request.dto";

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>
  ) {}

  async create(payload: CreateMeetingRequestDto): Promise<MeetingType> {
    const meeting = this.meetingRepository.create(payload);
    const savedMeeting = await this.meetingRepository.save(meeting);

    return this.toMeetingType(savedMeeting);
  }

  async list(includeClosed: boolean): Promise<MeetingListItemDto[]> {
    const meetings = await this.meetingRepository.find({ order: { id: "DESC" } });

    const meetingIds = meetings.map((m) => m.id);
    const countMap = await this.countApplicantsByMeetingIds(meetingIds);

    const rows = meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      category: meeting.category,
      description: meeting.description,
      maxParticipants: meeting.maxParticipants,
      deadline: meeting.deadline,
      announcement: meeting.announcement,
      isRecruiting: isRecruiting(meeting.deadline),
      applicantCount: countMap.get(meeting.id) ?? 0,
    }) satisfies MeetingListItemDto);

    if (includeClosed) {
      return rows;
    }

    return rows.filter((meeting) => meeting.isRecruiting);
  }

  async detail(id: number, userId: number, role: UserRole): Promise<MeetingDetailType> {
    const meeting = await this.meetingRepository.findOne({ where: { id } });

    if (!meeting) {
      throw new NotFoundException("모임을 찾을 수 없습니다");
    }

    const recruiting = isRecruiting(meeting.deadline);

    if (role === UserRole.ADMIN) {
      const statusCounts = await this.applicationRepository
        .createQueryBuilder("application")
        .select("application.status", "status")
        .addSelect("COUNT(*)", "count")
        .where("application.meetingId = :meetingId", { meetingId: meeting.id })
        .groupBy("application.status")
        .getRawMany<{ status: string; count: string }>();

      const countByStatus: Record<string, number> = {};
      let applicantCount = 0;
      for (const row of statusCounts) {
        const c = parseInt(row.count, 10);
        countByStatus[row.status] = c;
        applicantCount += c;
      }

      return {
        ...this.toMeetingType(meeting),
        isRecruiting: recruiting,
        applicantCount,
        selectedCount: countByStatus[ApplicationStatus.SELECTED] ?? 0,
        rejectedCount: countByStatus[ApplicationStatus.REJECTED] ?? 0,
        pendingCount: countByStatus[ApplicationStatus.PENDING] ?? 0,
      };
    }

    const applicantCount = await this.applicationRepository.count({ where: { meetingId: meeting.id } });

    const myApplication = await this.applicationRepository.findOne({ where: { meetingId: meeting.id, userId } });

    return {
      ...this.toMeetingType(meeting),
      isRecruiting: recruiting,
      applicantCount,
      canApply: recruiting && !myApplication,
      canCancel: Boolean(myApplication && myApplication.status === ApplicationStatus.PENDING),
      myApplication: myApplication ? this.toApplicationResult(myApplication, meeting.announcement) : null,
    };
  }

  private async countApplicantsByMeetingIds(meetingIds: number[]): Promise<Map<number, number>> {
    if (meetingIds.length === 0) return new Map();

    const counts = await this.applicationRepository
      .createQueryBuilder("application")
      .select("application.meetingId", "meetingId")
      .addSelect("COUNT(*)", "count")
      .where("application.meetingId IN (:...meetingIds)", { meetingIds })
      .groupBy("application.meetingId")
      .getRawMany<{ meetingId: number; count: string }>();

    const map = new Map<number, number>();
    for (const row of counts) {
      map.set(row.meetingId, parseInt(row.count, 10));
    }
    return map;
  }

  private toMeetingType(meeting: Meeting): MeetingType {
    return {
      id: meeting.id,
      title: meeting.title,
      category: meeting.category,
      description: meeting.description,
      maxParticipants: meeting.maxParticipants,
      deadline: meeting.deadline,
      announcement: meeting.announcement,
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
    };
  }

  private toApplicationResult(application: Application, announcement: string): ApplicationResultType {
    const isResultVisible = isAnnouncementPast(announcement);
    const displayStatus = isResultVisible ? application.status : ApplicationStatus.PENDING;

    return {
      id: application.id,
      userId: application.userId,
      meetingId: application.meetingId,
      status: displayStatus,
      displayStatus,
      resultMessage: toResultMessage(displayStatus, isResultVisible),
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    };
  }
}
