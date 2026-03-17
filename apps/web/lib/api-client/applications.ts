import {
  type ApplicationItemDto,
  type BatchUpdateApplicationStatusDto,
  type MyApplicationItemDto,
  type UpdateApplicationStatusDto,
} from "@packages/shared";
import { BaseApiClient } from "./base";

type CancelApplicationResponse = {
  id: number;
};

class ApplicationsApiClient extends BaseApiClient {
  async apply(meetingId: number, motivation?: string): Promise<ApplicationItemDto> {
    const response = await this.api.post<ApplicationItemDto>(`/meetings/${meetingId}/applications`, { motivation });
    return response.data;
  }

  async cancel(meetingId: number, applicationId: number): Promise<CancelApplicationResponse> {
    const response = await this.api.delete<CancelApplicationResponse>(`/meetings/${meetingId}/applications/${applicationId}`);
    return response.data;
  }

  async listMyApplications(): Promise<MyApplicationItemDto[]> {
    const response = await this.api.get<MyApplicationItemDto[]>("/my-applications");
    return response.data;
  }

  async listByMeeting(meetingId: number): Promise<ApplicationItemDto[]> {
    const response = await this.api.get<ApplicationItemDto[]>(`/admin/meetings/${meetingId}/applications`);
    return response.data;
  }

  async updateStatus(
    meetingId: number,
    applicationId: number,
    payload: UpdateApplicationStatusDto
  ): Promise<ApplicationItemDto> {
    const response = await this.api.patch<ApplicationItemDto>(
      `/admin/meetings/${meetingId}/applications/${applicationId}/status`,
      payload
    );
    return response.data;
  }

  async batchUpdateStatus(meetingId: number, payload: BatchUpdateApplicationStatusDto): Promise<ApplicationItemDto[]> {
    const response = await this.api.patch<ApplicationItemDto[]>(`/admin/meetings/${meetingId}/applications/status`, payload);
    return response.data;
  }
}

export const applicationsApiClient = new ApplicationsApiClient();
