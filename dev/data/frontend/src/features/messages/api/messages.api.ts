import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';
import type { Attachment } from '../types';

const base = API_CONFIG.endpoints.messages;

// response shape for uploadAttachment; kept here (rather than in types.ts) since it's a network-response wrapper, not a domain type
// check: tally with BE
export interface UploadAttachmentResponse {
  attachment: Attachment;
}

export const messagesApi = {
  getAllConversations() {
    return apiClient.get(`${base}`);
  },

  getConversationById(conversationId: string) {
    return apiClient.get(`${base}/${conversationId}`);
  },

  createConversation(data: {
    isGroup: boolean;
    groupName?: string;
    userIds: string[];
    message?: string;
  }) {
    return apiClient.post(`${base}`, data);
  },

  deleteConversation(conversationId: string) {
    return apiClient.delete(`${base}/${conversationId}`);
  },

  getMessages(conversationId: string) {
    return apiClient.get(`${base}/${conversationId}/messages`);
  },

  sendMessage(data: {
    conversationId: string;
    text?: string;
    attachments?: { id: string; name: string; kind: string; url: string; path: string }[];
  }) {
    return apiClient.post(`${base}/${data.conversationId}/messages`, data);
  },

  addMembers(data: { conversationId: string; userIds: string[] }) {
  	return apiClient.post(`${base}/${data.conversationId}/members`, { userIds: data.userIds });
   },

  removeMember(conversationId: string, targetUserId: string) {
  	return apiClient.delete(`${base}/${conversationId}/members/${targetUserId}`);
  },

  toggleConversationPin(conversationId: string) {
  	return apiClient.post(`${base}/${conversationId}/pin`);
  },

  markConversationRead(conversationId: string) {
  	return apiClient.post(`${base}/${conversationId}/read`);
  },

  // uses apiClient.upload because file uploads require FormData and upload progress
  uploadAttachment(
    conversationId: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<UploadAttachmentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);

	// check: tally with BE
    return apiClient.upload(`${base}/${conversationId}/attachments`, formData, onProgress);
  },
};