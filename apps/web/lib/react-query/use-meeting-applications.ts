"use client";

import {
  ApplicationStatus,
  type ApplicationItemDto,
  type BatchUpdateApplicationStatusDto,
  type UpdateApplicationStatusDto,
} from "@packages/shared";
import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { applicationsApiClient } from "@/lib/api-client";
import { meetingQueryKeys } from "./use-meetings";

type CancelApplicationResponse = {
  id: number;
};

type UpdateApplicationStatusVariables = {
  applicationId: number;
  status: ApplicationStatus;
};

export const applicationQueryKeys = {
  byMeeting: (meetingId: number) => ["meetings", meetingId, "applications"] as const,
};

async function refreshMeetingQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  meetingId: number,
  includeApplicants = false
) {
  const invalidations = [
    queryClient.invalidateQueries({ queryKey: meetingQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: meetingQueryKeys.detail(meetingId) }),
  ];

  if (includeApplicants) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: applicationQueryKeys.byMeeting(meetingId) }));
  }

  await Promise.all(invalidations);
}

export function useMeetingApplicantsQuery(meetingId: number, enabled = true): UseQueryResult<ApplicationItemDto[]> {
  return useQuery({
    queryKey: applicationQueryKeys.byMeeting(meetingId),
    queryFn: () => applicationsApiClient.listByMeeting(meetingId),
    enabled: enabled && Number.isInteger(meetingId) && meetingId > 0,
  });
}

export function useApplyToMeetingMutation(meetingId: number): UseMutationResult<ApplicationItemDto, unknown, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => applicationsApiClient.apply(meetingId),
    onSuccess: async () => {
      await refreshMeetingQueries(queryClient, meetingId);
    },
  });
}

export function useCancelMeetingApplicationMutation(
  meetingId: number
): UseMutationResult<CancelApplicationResponse, unknown, number> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId) => applicationsApiClient.cancel(meetingId, applicationId),
    onSuccess: async () => {
      await refreshMeetingQueries(queryClient, meetingId);
    },
  });
}

export function useUpdateMeetingApplicationStatusMutation(
  meetingId: number
): UseMutationResult<ApplicationItemDto, unknown, UpdateApplicationStatusVariables> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, status }) => {
      const payload: UpdateApplicationStatusDto = { status };
      return applicationsApiClient.updateStatus(meetingId, applicationId, payload);
    },
    onSuccess: async () => {
      await refreshMeetingQueries(queryClient, meetingId, true);
    },
  });
}

export function useBatchUpdateMeetingApplicationStatusMutation(
  meetingId: number
): UseMutationResult<ApplicationItemDto[], unknown, BatchUpdateApplicationStatusDto> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => applicationsApiClient.batchUpdateStatus(meetingId, payload),
    onSuccess: async () => {
      await refreshMeetingQueries(queryClient, meetingId, true);
    },
  });
}
