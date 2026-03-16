import { ApplicationResultType, ApplicationStatus, MeetingDetailType, MeetingListItemDto, MeetingType, UserRole } from "@packages/shared";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Application, Meeting } from "../../entity";
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

  async list(role: UserRole): Promise<MeetingListItemDto[]> {
    const meetings = await this.meetingRepository.find({ order: { id: "DESC" } });

    const rows = await Promise.all(
      meetings.map(async (meeting) => {
        const applicantCount = await this.applicationRepository.count({ where: { meetingId: meeting.id } });

        return {
          id: meeting.id,
          title: meeting.title,
          category: meeting.category,
          description: meeting.description,
          maxParticipants: meeting.maxParticipants,
          announcementDate: meeting.announcementDate,
          isRecruiting: this.isRecruiting(meeting.announcementDate),
          applicantCount,
        } satisfies MeetingListItemDto;
      })
    );

    if (role === UserRole.ADMIN) {
      return rows;
    }

    return rows.filter((meeting) => meeting.isRecruiting);
  }

  async detail(id: number, userId: number, role: UserRole): Promise<MeetingDetailType> {
    const meeting = await this.meetingRepository.findOne({ where: { id } });

    if (!meeting) {
      throw new NotFoundException("모임을 찾을 수 없습니다");
    }

    const isRecruiting = this.isRecruiting(meeting.announcementDate);
    const applicantCount = await this.applicationRepository.count({ where: { meetingId: meeting.id } });

    if (role === UserRole.ADMIN) {
      const [selectedCount, rejectedCount, pendingCount] = await Promise.all([
        this.applicationRepository.count({ where: { meetingId: meeting.id, status: ApplicationStatus.SELECTED } }),
        this.applicationRepository.count({ where: { meetingId: meeting.id, status: ApplicationStatus.REJECTED } }),
        this.applicationRepository.count({ where: { meetingId: meeting.id, status: ApplicationStatus.PENDING } }),
      ]);

      return {
        ...this.toMeetingType(meeting),
        isRecruiting,
        applicantCount,
        selectedCount,
        rejectedCount,
        pendingCount,
      };
    }

    const myApplication = await this.applicationRepository.findOne({ where: { meetingId: meeting.id, userId } });

    return {
      ...this.toMeetingType(meeting),
      isRecruiting,
      applicantCount,
      canApply: isRecruiting && !myApplication,
      canCancel: Boolean(myApplication && myApplication.status === ApplicationStatus.PENDING),
      myApplication: myApplication ? this.toApplicationResult(myApplication, meeting.announcementDate) : null,
    };
  }

  private isRecruiting(announcementDate: string): boolean {
    const today = new Date().toISOString().slice(0, 10);

    return announcementDate > today;
  }

  private toMeetingType(meeting: Meeting): MeetingType {
    return {
      id: meeting.id,
      title: meeting.title,
      category: meeting.category,
      description: meeting.description,
      maxParticipants: meeting.maxParticipants,
      announcementDate: meeting.announcementDate,
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
    };
  }

  private toApplicationResult(application: Application, announcementDate: string): ApplicationResultType {
    const isResultVisible = !this.isRecruiting(announcementDate);
    const displayStatus = isResultVisible ? application.status : ApplicationStatus.PENDING;

    return {
      id: application.id,
      userId: application.userId,
      meetingId: application.meetingId,
      status: displayStatus,
      displayStatus,
      resultMessage: this.toResultMessage(displayStatus, isResultVisible),
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    };
  }

  private toResultMessage(displayStatus: ApplicationStatus, isResultVisible: boolean): string {
    if (!isResultVisible) {
      return "발표일에 결과가 공개됩니다";
    }

    if (displayStatus === ApplicationStatus.SELECTED) {
      return "축하합니다! 모임에 선정되었어요";
    }

    if (displayStatus === ApplicationStatus.REJECTED) {
      return "아쉽게도 이번 모임에 함께하지 못했어요";
    }

    return "결과 대기중";
  }
}
