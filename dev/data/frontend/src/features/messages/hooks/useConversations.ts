import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import type { Conversation, ConversationResponse, LastMessage, Profile } from '../types';
import { messagesApi } from '../api/messages.api';
import { useSocket } from '@/context/SocketContext';
import { mapConversation } from '../lib/mappers';

// const PINNED_STORAGE_KEY = 'pinnedConversations';

// const loadPinnedIds = (): Set<string> => {
//   try {
//     const stored = localStorage.getItem(PINNED_STORAGE_KEY);

//     if (!stored) {
//       return new Set();
//     }

//     return new Set<string>(JSON.parse(stored));
//   } catch {
//     return new Set();
//   }
// };

// const savePinnedIds = (ids: Set<string>) => {
//   localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify([...ids]));
// };

const getConversationSortTime = (conversation: Conversation): number => {
  const timestamp = conversation.updatedAt ?? conversation.createdAt;

  return new Date(timestamp).getTime();
};

export interface AddConversationInput {
  participantIds: string[];
  isGroup: boolean;
  groupName?: string;
}

export const useConversations = () => {
  const { socket } = useSocket();
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.userId;
  
  // const { users, isLoading: usersLoading, error: usersError } = useUsers({
  //   excludeCurrentUser: true,
  // });
  // console.log('Current user:', currentUser); // Log the current user for debugging

  const refetch = useCallback(() => {
    if (!currentUserId) {
      return;
    }

    // setLoading(true);
    setError(null);

    messagesApi
      .getAllConversations()
      .then((response) => {
        // console.log("DEBUG(useConversations):response:", response);
        const fetched: Conversation[] = response.map((conversation) =>
          mapConversation(conversation, currentUserId)
        );

        setConversations(fetched);
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load conversations'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentUserId]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  // const [pinnedIds, setPinnedIds] = useState<Set<string>>(loadPinnedIds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const groupMessages = useMemo(
    () => conversations.filter((conversation) => conversation.type === 'group'),
    [conversations],
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  // listen fro real time messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      refetch();
    };

    socket.on('messageUpdated', handleNewMessage);

    return () => {
      socket.off('messageUpdated', handleNewMessage);
    };
  }, [socket, refetch]);

  // useEffect(() => {
  //   if (usersError) {
  //     setError(usersError);
  //   }
  // }, [usersError]);

  const addConversation = useCallback((conversation: Conversation) => {
    setConversations((previous) =>
      previous.some((item) => item.conversationId === conversation.conversationId) ? previous : [...previous, conversation],
    );
  }, []);

  const updateConversationLastMessage = useCallback((conversationId: string, lastMessage: LastMessage) => {
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.conversationId === conversationId
          ? { ...conversation, lastMessage, updatedAt: new Date().toISOString() }
          : conversation,
      ),
    );
  }, []);

  const addMembersToConversation = useCallback((conversationId: string, newMembers: Profile[]) => {
    setConversations((previous) =>
      previous.map((conversation) => {
        if (conversation.conversationId !== conversationId) {
          return conversation;
        }
  
        const existingIds = new Set((conversation.participants ?? []).map((member) => member.id));
        const toAdd = newMembers.filter((member) => !existingIds.has(member.id));
  
        if (toAdd.length === 0) {
          return conversation;
        }
  
        return { ...conversation, participants: [...(conversation.participants ?? []), ...toAdd] };
      }),
    );
  
    messagesApi
      .addMembers({ conversationId, participantIds: newMembers.map((member) => member.id) })
      .catch((error) => {
        console.error('Failed to add members:', error);
        // revert the optimistic setConversations update above on error.
        // refetch();
      });
  }, [refetch]);

  const removeMemberFromConversation = useCallback((conversationId: string, userId: string) => {
    setConversations((previous) =>
      previous.map((conversation) => {
        if (conversation.conversationId !== conversationId || !conversation.participants) {
          return conversation;
        }
  
        return { ...conversation, participants: conversation.participants.filter((member) => member.id !== userId) };
      }),
    );
  
    messagesApi.removeMember(conversationId, userId).catch((error) => {
      console.error('Failed to remove member:', error);
      // revert the optimistic setConversations update above on error.
      // refetch();
    });
  }, [refetch]);

  const removeConversation = useCallback((conversationId: string) => {
    setConversations((previous) => previous.filter((conversation) => conversation.conversationId !== conversationId));
  
    // setPinnedIds((previous) => {
    //   if (!previous.has(conversationId)) {
    //     return previous;
    //   }
  
    //   const next = new Set(previous);
    //   next.delete(conversationId);
  
    //   return next;
    // });
  
    messagesApi.deleteConversation(conversationId).catch((error) => {
      console.error('Failed to delete conversation:', error);
      // revert the optimistic removal above on error (e.g.
      // refetch, or re-insert the conversation into state).
      // refetch();
    });
  }, [refetch]);

  // >>>>>>>>>>>>>>> REAL API 
  // Keep the local `setPinnedIds` update for instant UI feedback, drop
  // `savePinnedIds`/localStorage, and persist via the API instead.
  //
  // const togglePin = useCallback((id: string) => {
  //   // setPinnedIds((previous) => {
  //   //   const next = new Set(previous);
  
  //   //   if (next.has(id)) {
  //   //     next.delete(id);
  //   //   } else {
  //   //     next.add(id);
  //   //   }
  
  //   //   return next;
  //   // });
  //   setConversations((previous) => 
  //     previous.map((conversation) => 
  //       conversation.conversationId === id? { ...conversation, pinned: !conversation.pinned } : conversation
  //   ));
  
  //   messagesApi.toggleConversationPin(id).catch((error) => {
  //     console.error('Failed to toggle pin:', error);
  //     // revert the optimistic setPinnedIds update above on error.
  //     // refetch();
  //   });
  // }, [refetch]);
  const togglePin = useCallback(
    async (conversationId: string) => {
      const conversation = conversations.find(
        (conversation) => conversation.conversationId === conversationId
      );

      if (!conversation) {
        return;
      }

      const wasPinned = Boolean(conversation.pinned);

      // Update FE immediately
      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.conversationId === conversationId
            ? { ...conversation, pinned: !wasPinned }
            : conversation
        )
      );

      try {
        if (wasPinned) {
          // Currently pinned -> unpin
          await messagesApi.unpinConversation(conversationId);
        } else {
          // Currently not pinned -> pin
          await messagesApi.pinConversation(conversationId);
        }
      } catch (error) {
        console.error('Failed to update pin:', error);

        // Revert FE if backend request fails
        setConversations((previous) =>
          previous.map((conversation) =>
            conversation.conversationId === conversationId
              ? { ...conversation, pinned: wasPinned }
              : conversation
          )
        );
      }
    },
    [conversations]
  );

  const markConversationRead = useCallback(async (conversationId: string) => {
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.conversationId === conversationId && conversation.unreadCount
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      ),
    );
  
    try {
      await messagesApi.markConversationRead(conversationId);
    } catch (error) {
      console.error('Failed to mark conversation read:', error);
      // Revert FE update if BE request fails
      // setConversations((previous) =>
      //   previous.map((conversation) =>
      //     conversation.id === conversationId
      //       ? { ...conversation, unreadCount: previous.unreadCount }
      //       : conversation,
      //   ),
      // );
      // refetch();
    }
  }, [refetch]);

  // const conversationsWithPinState = useMemo(
  //   () => conversations.map((conversation) => ({ ...conversation, pinned: pinnedIds.has(conversation.id) })),
  //   [conversations, pinnedIds],
  // );

  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => getConversationSortTime(b) - getConversationSortTime(a)),
    [conversations],
  );

  const groupedConversations = useMemo(() => {
    const pinned = sortedConversations.filter((conversation) => conversation.pinned);
    const recent = sortedConversations.filter((conversation) => !conversation.pinned);

    return { pinned, recent, all: sortedConversations };
  }, [sortedConversations]);

  const existingConversationUserIds = useMemo(() => {
    const participantIds = new Set<string>();

    groupedConversations.all.forEach((conversation) => {
      if (conversation.type === 'direct' && conversation.userId) {
        participantIds.add(conversation.userId);
      }
    });

    return participantIds;
  }, [groupedConversations.all]);

  return {
    pinned: groupedConversations.pinned,
    recent: groupedConversations.recent,
    all: groupedConversations.all,
    loading,
    error,
    togglePin,
	  markConversationRead,
    addConversation,
    updateConversationLastMessage,
    addMembersToConversation,
    removeMemberFromConversation,
    removeConversation,
    existingConversationUserIds,
    groupMessages,
    refetch,
  };
};
