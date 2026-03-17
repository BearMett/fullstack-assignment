import { ApplicationItemDto, MyApplicationItemDto, UserRole } from "@packages/shared";
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthRequestUser } from "../auth/types/auth-request-user.type";
import { ApplicationsService } from "./applications.service";
import { ApplyRequestDto } from "./dto/apply-request.dto";
import { BatchUpdateApplicationStatusRequestDto } from "./dto/batch-update-application-status-request.dto";
import { UpdateApplicationStatusRequestDto } from "./dto/update-application-status-request.dto";

@Controller()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("meetings/:meetingId/applications")
  async apply(
    @Param("meetingId", ParseIntPipe) meetingId: number,
    @CurrentUser() user: AuthRequestUser,
    @Body() body: ApplyRequestDto
  ): Promise<ApplicationItemDto> {
    return this.applicationsService.apply(meetingId, user.userId, body.motivation);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("meetings/:meetingId/applications/:applicationId")
  async cancel(
    @Param("meetingId", ParseIntPipe) meetingId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @CurrentUser() user: AuthRequestUser
  ): Promise<{ id: number }> {
    return this.applicationsService.cancel(meetingId, applicationId, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("my-applications")
  async listMyApplications(@CurrentUser() user: AuthRequestUser): Promise<MyApplicationItemDto[]> {
    return this.applicationsService.listByUser(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("admin/meetings/:meetingId/applications")
  async listByMeeting(@Param("meetingId", ParseIntPipe) meetingId: number): Promise<ApplicationItemDto[]> {
    return this.applicationsService.listByMeeting(meetingId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch("admin/meetings/:meetingId/applications/:applicationId/status")
  async updateStatus(
    @Param("meetingId", ParseIntPipe) meetingId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Body() payload: UpdateApplicationStatusRequestDto
  ): Promise<ApplicationItemDto> {
    return this.applicationsService.updateStatus(meetingId, applicationId, payload.status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch("admin/meetings/:meetingId/applications/status")
  async batchUpdateStatus(
    @Param("meetingId", ParseIntPipe) meetingId: number,
    @Body() payload: BatchUpdateApplicationStatusRequestDto
  ): Promise<ApplicationItemDto[]> {
    return this.applicationsService.batchUpdateStatus(meetingId, payload.updates);
  }
}
