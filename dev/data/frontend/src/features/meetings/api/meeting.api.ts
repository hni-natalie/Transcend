import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';

const base = API_CONFIG.endpoints.meetings;
const usersBase = API_CONFIG.endpoints.users.base;

export const meetingApi = {
  // =====================
  // CORE MEETINGS
  // =====================

  getAllMeetings() {
    return apiClient.get(`${base}`);
  },

  getMeetingById(meetId: string) {
    return apiClient.get(`${base}/${meetId}`);
  },

  createMeeting(data: {
    spaceId: string;
    meetTitle: string;
    meetDesc?: string;
    meetStart: string;
    meetEnd: string;
    participants?: string[];
  }) {
    return apiClient.post(`${base}`, data);
  },

  updateMeeting(data: {
    meetId: string;
    meetTitle?: string;
    meetDesc?: string;
    meetStart?: string;
    meetEnd?: string;
    addParticipants?: string[];
  }) {
    return apiClient.put(`${base}`, data);
  },

  deleteMeeting(meetId: string) {
    return apiClient.delete(`${base}/${meetId}`);
  },

  // =====================
  // USER SCOPES
  // =====================

  getMyMeetings(userId: string) {
    return apiClient.get(`${base}/user/${userId}`);
  },

  getJoinedMeetings(userId: string) {
    return apiClient.get(`${base}/participant/${userId}`);
  },

  // =====================
  // PARTICIPANTS
  // =====================

  updateParticipant(data: {
    meetId: string;
    targetUserId: string;
    role?: string;
    attendance?: boolean;
  }) {
    return apiClient.patch(`${base}/participant`, data);
  },

  removeParticipant(meetId: string, targetUserId: string) {
    return apiClient.delete(`${base}/participant`, {
      data: { meetId, targetUserId },
    });
  },

  // =====================
  // FEATURES
  // =====================

  toggleMeetingPin(meetId: string) {
    return apiClient.patch(`${base}/pin/${meetId}`);
  },

  // =====================
  // USERS
  // =====================
  allUsers() {
    return apiClient.get(`${usersBase}`);
  }

};