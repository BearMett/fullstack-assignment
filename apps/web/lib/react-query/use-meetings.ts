"use client";

import { type CreateMeetingDto, type MeetingDetailDto, type MeetingListItemDto, type MeetingType } from "@packages/shared";
import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { meetingsApiClient, type MeetingsListParams } from "@/lib/api-client/meetings";

export const meetingQueryKeys = {
  all: (params?: MeetingsListParams) => ["meetings", params ?? {}] as const,
  detail: (meetingId: number) => ["meetings", meetingId] as const,
};

export function useMeetingsQuery(params?: MeetingsListParams): UseQueryResult<MeetingListItemDto[]> {
  return useQuery({
    queryKey: meetingQueryKeys.all(params),
    queryFn: () => meetingsApiClient.list(params),
  });
}

export function useMeetingDetailQuery(meetingId: number): UseQueryResult<MeetingDetailDto> {
  return useQuery({
    queryKey: meetingQueryKeys.detail(meetingId),
    queryFn: () => meetingsApiClient.detail(meetingId),
    enabled: Number.isInteger(meetingId) && meetingId > 0,
  });
}

export function useCreateMeetingMutation(): UseMutationResult<MeetingType, unknown, CreateMeetingDto> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => meetingsApiClient.create(payload),
    onSuccess: async (meeting) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meetings"] }),
        queryClient.invalidateQueries({ queryKey: meetingQueryKeys.detail(meeting.id) }),
      ]);
    },
  });
}
