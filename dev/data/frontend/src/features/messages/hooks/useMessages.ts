import { useCallback, useState } from 'react';
import type { DayGroup, Message } from '../types';
// import { messagesApi } from '../api/messages.api'; // uncomment for BE implmentation

// imports below to remove once BE is implemented
import { dayGroups as mockDirectDayGroups } from '../mocks/messages';
import { groupDayGroups as mockGroupDayGroups } from '../mocks/messagesGroup';

type ConversationKind = 'direct' | 'group';

interface UseMessagesOptions {
  conversationId?: string;
  kind?: ConversationKind;
  isNew?: boolean; // KIV : to remove once BE implemented
}

export function useMessages({ conversationId, kind, isNew }: UseMessagesOptions) {
  // TO DO:
  // replace this client-side cache with a query cache (React Query/SWR).
  // call API (GET /conversations/{id}/messages) 
  // use messagesApi.getMessages(conversationId).
  const [store, setStore] = useState<Record<string, DayGroup[]>>({});

  const loadIfNeeded = useCallback(
    (id: string, conversationKind: ConversationKind) => {
      setStore((previous) => {
        if (previous[id]) {
          return previous;
        }

        // TO DO:
		// call API (GET /conversations/{conversationId}/messages)
		// use messagesApi.getMessages(id) instead of mock messages
        const seed = conversationKind === 'group' ? mockGroupDayGroups : mockDirectDayGroups;

        return { ...previous, [id]: seed };
      });
    },
    [],
  );

  const sendMessage = useCallback(
    (id: string, message: Message) => {
      setStore((previous) => {
        const existing = previous[id] ?? [];

        const today = new Date(message.createdAt).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        const todayGroup = existing.find((group) => group.label === today);

       	// TO DO: 
		// call API (POST /conversations/{id}/messages)
		// use messagesApi.sendMessage({ conversationId: id, text, attachments })
        const next = todayGroup
          ? existing.map((group) =>
              group.label === today ? { ...group, messages: [...group.messages, message] } : group,
            )
          : [...existing, { id: `day-${Date.now()}`, label: today, messages: [message] }];

        return { ...previous, [id]: next };
      });
    },
    [],
  );

  const messages: DayGroup[] =
    conversationId && !isNew ? store[conversationId] ?? [] : [];

  return {
    messages,
    /** Call once per selected conversation to ensure its history is loaded. */
    loadIfNeeded: () => {
      if (conversationId && kind && !isNew) {
        loadIfNeeded(conversationId, kind);
      }
    },
    sendMessage,
  };
}