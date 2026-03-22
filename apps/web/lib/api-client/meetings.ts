import { type CreateMeetingDto, type MeetingDetailDto, type MeetingListItemDto, type MeetingType } from "@packages/shared";
import { BaseApiClient } from "./base";

export interface MeetingsListParams {
  includeClosed?: boolean;
}

class MeetingsApiClient extends BaseApiClient {
  async create(payload: CreateMeetingDto): Promise<MeetingType> {
    const response = await this.api.post<MeetingType>("/meetings", payload);
    return response.data;
  }

  async list(params?: MeetingsListParams): Promise<MeetingListItemDto[]> {
    const response = await this.api.get<MeetingListItemDto[]>("/meetings", {
      params: params?.includeClosed ? { includeClosed: true } : undefined,
    });
    return response.data;
  }

  async detail(id: number): Promise<MeetingDetailDto> {
    const response = await this.api.get<MeetingDetailDto>(`/meetings/${id}`);
    return response.data;
  }
}

export const meetingsApiClient = new MeetingsApiClient();
