import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';
import { RecordingStatusResponse } from '../meeting.types';

const base = API_CONFIG.endpoints.meetings;
const usersBase = API_CONFIG.endpoints.users.base;
const recordingsBase = API_CONFIG.endpoints.recordings;

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
    }) {
    	return apiClient.post(`${base}`, data);
    },

    updateMeeting(data: {
      meetId: string;
      meetTitle?: string;
      meetDesc?: string;
      meetStart?: string;
      meetEnd?: string;
    }) {
    	return apiClient.patch(`${base}`, data);
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

    syncParticipants(data: {
      meetId: string;
      participants: {
        userId: string;
        role: "organiser" | "participant";
        attendance: "present" | "absent" | "pending";
      }[];
      meetStart?: string;
      meetEnd?: string;
    }) {
      	return apiClient.patch(`${base}/participants`, data);
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
    },

    // =====================
    // LIVEKIT
    // =====================
    startMeeting(meetId: string) {
      return apiClient.patch(`${base}/${meetId}/start`);
    },

    endMeeting(meetId: string) {
      return apiClient.patch(`${base}/${meetId}/end`);
    },

    // =====================
    // RECORDING
    // =====================
    startRecording(meetId: string) {
      return apiClient.post(`${recordingsBase}/start`, { meetId });
    },
    
    stopRecording(meetId: string) {
      return apiClient.patch(`${recordingsBase}/stop/${meetId}`);
    },

    finalizeRecordings() {
      return apiClient.post(`${recordingsBase}/finalize`);
    },

    getRecordings(meetId: string) {
      return apiClient.get(`${recordingsBase}/${meetId}`);
    },

    getRecordingStatus(meetId: string) {
      return apiClient.get<RecordingStatusResponse>(`${recordingsBase}/status/${meetId}`);
    },

    // =====================
    // Meeting Chat
    // ===================== 
    createChatMessage(
      meetId: string,
      data: {
        senderId: string;
        senderName: string;
        message: string;
      }
    ) {
      return apiClient.post(`${base}/${meetId}/chat`, data);
    },

    getChatMessages(meetId: string) {
      return apiClient.get(`${base}/${meetId}/chat`);
    },
};