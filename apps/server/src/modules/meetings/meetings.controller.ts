import { MeetingDetailType, MeetingListItemDto, MeetingType, UserRole } from "@packages/shared";
import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthRequestUser } from "../auth/types/auth-request-user.type";
import { CreateMeetingRequestDto } from "./dto/create-meeting-request.dto";
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
  async list(@CurrentUser() user: AuthRequestUser): Promise<MeetingListItemDto[]> {
    return this.meetingsService.list(user.role);
  }

  @Get(":id")
  async detail(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthRequestUser): Promise<MeetingDetailType> {
    return this.meetingsService.detail(id, user.userId, user.role);
  }
}
