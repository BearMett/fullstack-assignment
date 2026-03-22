import { MeetingDetailType, MeetingListItemDto, MeetingType, UserRole } from "@packages/shared";
import { Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthRequestUser } from "../auth/types/auth-request-user.type";
import { CreateMeetingRequestDto } from "./dto/create-meeting-request.dto";
import { ListMeetingsQueryDto } from "./dto/list-meetings-query.dto";
import { MeetingsService } from "./meetings.service";

@Controller("meetings")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() payload: CreateMeetingRequestDto): Promise<MeetingType> {
    return this.meetingsService.create(payload);
  }

  @Get()
  async list(
    @Query() query: ListMeetingsQueryDto,
    @CurrentUser() user: AuthRequestUser,
  ): Promise<MeetingListItemDto[]> {
    if (query.includeClosed && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("권한이 없습니다");
    }
    return this.meetingsService.list(query.includeClosed ?? false);
  }

  @Get(":id")
  async detail(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthRequestUser): Promise<MeetingDetailType> {
    return this.meetingsService.detail(id, user.userId, user.role);
  }
}
