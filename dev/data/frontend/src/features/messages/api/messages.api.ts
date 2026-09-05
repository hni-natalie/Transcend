import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';
import { Conversation, ConversationResponse, Message, MessageResponse, UploadedAttachment, type Attachment } from '../types';
// import { mapConversation } from '../lib/mappers'
// import { useAuth } from '@/features/auth/AuthContext';

const base = API_CONFIG.endpoints.messages;

export const messagesApi = {
  getAllConversations() {
    return apiClient.get<ConversationResponse[]>(base);
  },

  createGroupConversation(data: {
    groupName?: string;
    participantIds: string[];
  }) {
    return apiClient.post<ConversationResponse>(
      `${base}/group`,
      data
    );
  },

  createDirectConversation(data: {
    participantId: string;
  }) {
    return apiClient.post<ConversationResponse>(
      `${base}/direct`,
      data
    );
  },
  deleteConversation(conversationId: string) {
    return apiClient.delete(`${base}/${conversationId}`);
  },

  getMessages(conversationId: string) {
    return apiClient.get<MessageResponse[]>(`${base}/${conversationId}/messages`);
  },

  sendMessage(data: {
    conversationId: string;
    text?: string;
    attachments?: UploadedAttachment[];
  }) {
    return apiClient.post<Message>(`${base}/${data.conversationId}/messages`, data);
  },

  addMembers(data: { conversationId: string; participantIds: string[] }) {
  	return apiClient.post(`${base}/${data.conversationId}/participants`, { userIds: data.participantIds });
   },

  removeMember(conversationId: string, targetUserId: string) {
  	return apiClient.delete(`${base}/${conversationId}/participants/${targetUserId}`);
  },

  pinConversation(conversationId: string) {
  	return apiClient.post(`${base}/${conversationId}/pin`);
  },
  unpinConversation(conversationId: string) {
  	return apiClient.delete(`${base}/${conversationId}/pin`);
  },

  markConversationRead(conversationId: string) {
  	return apiClient.post(`${base}/${conversationId}/read`);
  },

  uploadAttachment(conversationId: string, file: File, onProgress?: (percent: number) => void,
  ): Promise<UploadedAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);

    return apiClient.upload<UploadedAttachment>(`${base}/${conversationId}/attachments`, formData, onProgress);
  },
};