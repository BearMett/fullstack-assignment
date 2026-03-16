"use client";

import { type CreateMeetingDto, type MeetingDetailDto, type MeetingListItemDto, type MeetingType } from "@packages/shared";
import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { meetingsApiClient } from "@/lib/api-client";

export const meetingQueryKeys = {
  all: ["meetings"] as const,
  detail: (meetingId: number) => ["meetings", meetingId] as const,
};

export function useMeetingsQuery(): UseQueryResult<MeetingListItemDto[]> {
  return useQuery({
    queryKey: meetingQueryKeys.all,
    queryFn: () => meetingsApiClient.list(),
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
        queryClient.invalidateQueries({ queryKey: meetingQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: meetingQueryKeys.detail(meeting.id) }),
      ]);
    },
  });
}
