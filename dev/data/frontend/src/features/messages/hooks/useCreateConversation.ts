import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import type { Conversation } from '../types';
// import { messagesApi } from '../api/messages.api'; // uncomment for BE implmentation

export interface CreateConversationInput {
  userIds: string[];
  isGroup: boolean;
  groupName?: string;
}

export const useCreateConversation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { showToast } = useToast();

  const createConversation = async (data: CreateConversationInput): Promise<Conversation> => {
    setIsCreating(true);

    try {
      if (data.userIds.length === 0) {
        throw new Error('At least one user is required');
      }

      if (data.isGroup && !data.groupName?.trim()) {
        throw new Error('Group name is required');
      }

	  // TO DO: 
	  // call API (POST /conversations)
	  // use messagesApi.createConversation({ isGroup, groupName, userIds, message }).
	  // >>>>>>>>>>>>>>> MOCK >>>>>>>>>>>>>>>>>>
      await new Promise<void>((resolve) => setTimeout(resolve, 500));

      const id = data.isGroup ? `group-${Date.now()}` : `user-${data.userIds[0]}`;
      const createdAt = new Date().toISOString();

      const conversation: Conversation = {
        id,
        type: data.isGroup ? 'group' : 'direct',
        name: data.isGroup ? data.groupName!.trim() : 'New Conversation',
        createdAt,
        updatedAt: undefined,
        pinned: false,
        lastMessage: undefined,
        ...(data.isGroup ? {} : { userId: data.userIds[0] }),
        ...(data.isGroup ? { members: [] } : {}),
      };

      return conversation;
	  // >>>>>>>>>>>>>>> END OF MOCK >>>>>>>>>>>>>>>>>>


	   // >>>>>>>>>>>>>>>  REAL API (uncomment once BE route is ready)
      // const response = await messagesApi.createConversation({
      //   isGroup: data.isGroup,
      //   groupName: data.isGroup ? data.groupName!.trim() : undefined,
      //   userIds: data.userIds,
      // });
      //
      // const conversation: Conversation = response.data;
      //
      // return conversation;
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

