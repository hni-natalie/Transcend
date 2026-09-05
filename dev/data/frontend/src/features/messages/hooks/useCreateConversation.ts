import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';

import { useToast } from '@/context/ToastContext';
import type { Conversation } from '../types';
import { messagesApi } from '../api/messages.api';
import { mapConversation } from '../lib/mappers';


export interface CreateConversationInput {
  participantIds: string[];
  isGroup: boolean;
  groupName?: string;
}

export const useCreateConversation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.userId;

  const createConversation = async (data: CreateConversationInput): Promise<Conversation> => {
    if (!currentUserId) {
      throw new Error('User is not logged in');
    }
    setIsCreating(true);

    try {
      if (data.participantIds.length === 0) {
        throw new Error('At least one participant is required');
      }

      if (data.isGroup && !data.groupName?.trim()) {
        throw new Error('Group name is required');
      }

    let response;
    if (data.isGroup)
      response = await messagesApi.createGroupConversation({ groupName: data.groupName, participantIds: data.participantIds });
    else
      response = await messagesApi.createDirectConversation({ participantId: data.participantIds[0] });

	   // >>>>>>>>>>>>>>>  REAL API (uncomment once BE route is ready)
      // const response = await messagesApi.createConversation({
      //   isGroup: data.isGroup,
      //   groupName: data.isGroup ? data.groupName!.trim() : undefined,
      //   userIds: data.participantIds,
      // });
      // console.log('RAW CREATE RESPONSE:', response);
      const conversation: Conversation = mapConversation(response, currentUserId);
      // console.log('MAPPED CONVERSATION:', conversation);
      return conversation;
      // >>>>>>>>>>>>>>>  END REAL API 

    } catch (error) {
      showToast('error', 'Failed to create conversation');
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return { createConversation, isCreating };
};

