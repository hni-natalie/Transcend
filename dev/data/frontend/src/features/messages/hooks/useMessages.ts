import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import { useSocket } from '@/context/SocketContext';
import type { MessageResponse, SendMessageInput } from '../types';
import { messagesApi } from '../api/messages.api';
import { messagesToDayGroups, mapMessage } from '../lib/mappers'

type ConversationKind = 'direct' | 'group';

interface UseMessagesOptions {
  conversationId?: string;
  kind?: ConversationKind;
  // isNew?: boolean; // KIV : to remove once BE implemented // to indicate if the conversation is new and has no messages yet
}

interface MessageUpdatedEvent {
  conversationId: string;
  message: MessageResponse;
}

export function useMessages({ conversationId, kind}: UseMessagesOptions) {
  const { user: currentUser } = useAuth();
  const { socket, enableSocket } = useSocket();
  const currentUserId = currentUser?.userId;
  const queryClient = useQueryClient();

  // Only fetch when we have a real, existing conversation to load.
  const shouldFetch = Boolean(conversationId && kind && currentUserId);
  const queryKey = ['messages', conversationId] as const;

  useEffect(() => {
    enableSocket();
  }, [enableSocket]);


  // http + socket uses same path, avoid duplication by checking id
  const addMessageToCache = useCallback((message: MessageResponse) => {
    if (!conversationId || message.conversationId !== conversationId) {
      return;
    }

    queryClient.setQueryData<MessageResponse[]>(queryKey, (previous) => {
      if (!previous) {
        return [message];
      }

      if (previous.some(({ messageId }) => messageId === message.messageId)) {
        return previous;
      }

      return [...previous, message];
    });
  }, [conversationId, queryClient, queryKey]);

  const { data: messages = [] } = useQuery({
    queryKey,

    queryFn: () =>
      messagesApi.getMessages(conversationId!),

    select: (response: MessageResponse[]) => {
      if (!currentUserId) {
      return [];
    }
      // Backend response -> frontend Message[]
      // console.log("DEBUGG: response:", response);
      const mappedMessages = response.map((message) =>
        mapMessage(message, currentUserId)
      );

      // Message[] -> DayGroup[]
      return messagesToDayGroups(mappedMessages);
    },

    enabled: shouldFetch,
  });

  useEffect(() => {
    if (!socket || !conversationId) {
      return;
    }

    const handleMessageUpdated = (event: MessageUpdatedEvent) => {
      if (!event?.message) {
        return;
      }

      addMessageToCache(event.message);
    };

    socket.on('messageUpdated', handleMessageUpdated);
    return () => {
      socket.off('messageUpdated', handleMessageUpdated);
    };
  }, [socket, conversationId, addMessageToCache]);

  const { mutate: sendMessage } = useMutation({
    mutationFn: (message: SendMessageInput) =>
      messagesApi.sendMessage({
        conversationId: conversationId!,
        text: message.text,
        attachments: message.attachments,
      }),
    onSuccess: (message) => {
      addMessageToCache(message);
    },
  });

  return {
    messages,
    sendMessage,
  };
}