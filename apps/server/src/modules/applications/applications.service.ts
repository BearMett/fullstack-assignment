import { ApplicationItemDto, ApplicationStatus, MyApplicationItemDto } from "@packages/shared";
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Repository } from "typeorm";
import { Application, Meeting } from "../../entity";
import {
  APPLICATION_NOT_FOUND_MESSAGE,
  CAPACITY_EXCEEDED_MESSAGE,
  DUPLICATE_APPLICATION_MESSAGE,
  DUPLICATE_BATCH_TARGET_MESSAGE,
  MEETING_NOT_FOUND_MESSAGE,
  ONLY_OWNER_CAN_CANCEL_MESSAGE,
  ONLY_PENDING_CAN_CANCEL_MESSAGE,
  RECRUITING_CLOSED_MESSAGE,
} from "./applications.constants";

interface BatchStatusUpdateItem {
  applicationId: number;
  status: ApplicationStatus;
}

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application) private readonly applicationRepository: Repository<Application>,
    @InjectRepository(Meeting) private readonly meetingRepository: Repository<Meeting>
  ) {}

  async apply(meetingId: number, userId: number, motivation?: string): Promise<ApplicationItemDto> {
    const meeting = await this.requireMeeting(meetingId);

    if (!this.isRecruiting(meeting.deadlineDate)) {
      throw new BadRequestException(RECRUITING_CLOSED_MESSAGE);
    }

    const existingApplication = await this.applicationRepository.findOne({
      where: { meetingId, userId },
      relations: { user: true },
    });

    if (existingApplication) {
      // Allow reapply if meeting policy allows and previous application was REJECTED
      if (meeting.allowReapply && existingApplication.status === ApplicationStatus.REJECTED) {
        existingApplication.status = ApplicationStatus.PENDING;
        existingApplication.motivation = motivation ?? null;
        const saved = await this.applicationRepository.save(existingApplication);
        return this.toApplicationItem(saved);
      }

      throw new ConflictException(DUPLICATE_APPLICATION_MESSAGE);
    }

    const application = this.applicationRepository.create({
      meetingId,
      userId,
      status: ApplicationStatus.PENDING,
      motivation: motivation ?? null,
    });

    const saved = await this.applicationRepository.save(application);
    // Reload with user relation for the response
    const reloaded = await this.applicationRepository.findOne({
      where: { id: saved.id },
      relations: { user: true },
    });
    return this.toApplicationItem(reloaded!);
  }

  async cancel(meetingId: number, applicationId: number, userId: number): Promise<{ id: number }> {
    const application = await this.requireApplication(meetingId, applicationId);

    if (application.userId !== userId) {
      throw new ForbiddenException(ONLY_OWNER_CAN_CANCEL_MESSAGE);
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException(ONLY_PENDING_CAN_CANCEL_MESSAGE);
    }

    await this.applicationRepository.delete({ id: application.id });
    return { id: application.id };
  }

  async listByMeeting(meetingId: number): Promise<ApplicationItemDto[]> {
    await this.requireMeeting(meetingId);

    const applications = await this.applicationRepository.find({
      where: { meetingId },
      relations: { user: true },
      order: { createdAt: "ASC", id: "ASC" },
    });

    return applications.map((application) => this.toApplicationItem(application));
  }

  async listByUser(userId: number): Promise<MyApplicationItemDto[]> {
    const applications = await this.applicationRepository.find({
      where: { userId },
      relations: { meeting: true },
      order: { createdAt: "DESC" },
    });

    return applications.map((application) => {
      const isResultVisible = this.isAnnouncementPast(application.meeting.announcementDate);
      const displayStatus = isResultVisible ? application.status : ApplicationStatus.PENDING;

      return {
        id: application.id,
        meetingId: application.meetingId,
        meetingTitle: application.meeting.title,
        meetingCategory: application.meeting.category,
        announcementDate: application.meeting.announcementDate,
        status: application.status,
        displayStatus,
        resultMessage: this.toResultMessage(displayStatus, isResultVisible),
        createdAt: application.createdAt.toISOString(),
      };
    });
  }

  async updateStatus(meetingId: number, applicationId: number, status: ApplicationStatus): Promise<ApplicationItemDto> {
    return this.applicationRepository.manager.transaction(async (manager) => {
      const meeting = await this.requireMeetingInManager(manager, meetingId);
      const application = await this.requireApplicationInManager(manager, meetingId, applicationId);

      await this.ensureCapacityForStatusChange(manager, meeting, application, status);

      application.status = status;
      const saved = await manager.getRepository(Application).save(application);

      return this.toApplicationItem(saved);
    });
  }

  async batchUpdateStatus(meetingId: number, updates: BatchStatusUpdateItem[]): Promise<ApplicationItemDto[]> {
    return this.applicationRepository.manager.transaction(async (manager) => {
      const meeting = await this.requireMeetingInManager(manager, meetingId);
      this.ensureNoDuplicateBatchTargets(updates);

      const targetIds = updates.map((update) => update.applicationId);
      const applications = await manager.getRepository(Application).find({
        where: { id: In(targetIds), meetingId },
      });

      if (applications.length !== targetIds.length) {
        throw new NotFoundException(APPLICATION_NOT_FOUND_MESSAGE);
      }

      const applicationById = new Map<number, Application>();
      for (const application of applications) {
        applicationById.set(application.id, application);
      }

      let selectedCount = await manager
        .getRepository(Application)
        .count({ where: { meetingId, status: ApplicationStatus.SELECTED } });

      const nextStatusById = new Map<number, ApplicationStatus>();
      for (const application of applications) {
        nextStatusById.set(application.id, application.status);
      }

      for (const update of updates) {
        const currentStatus = nextStatusById.get(update.applicationId);

        if (!currentStatus) {
          throw new NotFoundException(APPLICATION_NOT_FOUND_MESSAGE);
        }

        if (currentStatus !== ApplicationStatus.SELECTED && update.status === ApplicationStatus.SELECTED) {
          selectedCount += 1;
        }

        if (currentStatus === ApplicationStatus.SELECTED && update.status !== ApplicationStatus.SELECTED) {
          selectedCount -= 1;
        }

        if (selectedCount > meeting.maxParticipants) {
          throw new BadRequestException(CAPACITY_EXCEEDED_MESSAGE);
        }

        nextStatusById.set(update.applicationId, update.status);
      }

      for (const update of updates) {
        const application = applicationById.get(update.applicationId);

        if (!application) {
          throw new NotFoundException(APPLICATION_NOT_FOUND_MESSAGE);
        }

        application.status = update.status;
      }

      const saved = await manager.getRepository(Application).save(Array.from(applicationById.values()));
      const sorted = saved.sort((a, b) => a.id - b.id);

      return sorted.map((application) => this.toApplicationItem(application));
    });
  }

  private ensureNoDuplicateBatchTargets(updates: BatchStatusUpdateItem[]): void {
    const seen = new Set<number>();

    for (const update of updates) {
      if (seen.has(update.applicationId)) {
        throw new BadRequestException(DUPLICATE_BATCH_TARGET_MESSAGE);
      }

      seen.add(update.applicationId);
    }
  }

  private async ensureCapacityForStatusChange(
    manager: EntityManager,
    meeting: Meeting,
    application: Application,
    nextStatus: ApplicationStatus
  ): Promise<void> {
    if (application.status === nextStatus) {
      return;
    }

    const selectedCount = await manager
      .getRepository(Application)
      .count({ where: { meetingId: meeting.id, status: ApplicationStatus.SELECTED } });

    const nextSelectedCount =
      application.status !== ApplicationStatus.SELECTED && nextStatus === ApplicationStatus.SELECTED
        ? selectedCount + 1
        : application.status === ApplicationStatus.SELECTED && nextStatus !== ApplicationStatus.SELECTED
          ? selectedCount - 1
          : selectedCount;

    if (nextSelectedCount > meeting.maxParticipants) {
      throw new BadRequestException(CAPACITY_EXCEEDED_MESSAGE);
    }
  }

  private isRecruiting(deadlineDate: string): boolean {
    const today = new Date().toISOString().slice(0, 10);
    return deadlineDate >= today;
  }

  private isAnnouncementPast(announcementDate: string): boolean {
    const today = new Date().toISOString().slice(0, 10);
    return announcementDate <= today;
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

  private async requireMeeting(meetingId: number): Promise<Meeting> {
    const meeting = await this.meetingRepository.findOne({ where: { id: meetingId } });

    if (!meeting) {
      throw new NotFoundException(MEETING_NOT_FOUND_MESSAGE);
    }

    return meeting;
  }

  private async requireMeetingInManager(manager: EntityManager, meetingId: number): Promise<Meeting> {
    const meeting = await manager.getRepository(Meeting).findOne({ where: { id: meetingId } });

    if (!meeting) {
      throw new NotFoundException(MEETING_NOT_FOUND_MESSAGE);
    }

    return meeting;
  }

  private async requireApplication(meetingId: number, applicationId: number): Promise<Application> {
    const application = await this.applicationRepository.findOne({ where: { id: applicationId, meetingId } });

    if (!application) {
      throw new NotFoundException(APPLICATION_NOT_FOUND_MESSAGE);
    }

    return application;
  }

  private async requireApplicationInManager(
    manager: EntityManager,
    meetingId: number,
    applicationId: number
  ): Promise<Application> {
    const application = await manager.getRepository(Application).findOne({ where: { id: applicationId, meetingId } });

    if (!application) {
      throw new NotFoundException(APPLICATION_NOT_FOUND_MESSAGE);
    }

    return application;
  }

  private toApplicationItem(application: Application): ApplicationItemDto {
    return {
      id: application.id,
      userId: application.userId,
      meetingId: application.meetingId,
      status: application.status,
      displayStatus: application.status,
      motivation: application.motivation ?? undefined,
      userName: application.user?.name,
      userEmail: application.user?.email,
      userPhone: application.user?.phone,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    };
  }
}
