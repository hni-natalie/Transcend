import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import type { Conversation, ConversationResponse, LastMessage, Profile } from '../types';
import { messagesApi } from '../api/messages.api'; // uncomment for BE implmentation

import { mapConversation } from '../lib/mappers';

// TO DO: imports below to remove after BE implementation
// import { useUsers } from '@shared';
// import type { User } from '@shared';
// import { buildLastMessagePreview, getLastMessageForConversation, toProfile } from '../lib/mappers';
// import { useGroupMessages } from './useGroupMessages';
// import { dayGroups as mockDirectDayGroups } from '../mocks/messages';
// import { groupDayGroups as mockGroupDayGroups } from '../mocks/messagesGroup';

// TO DO: remove these lines once API (GET /conversations) returns lastMessage directly
// const mockDirectLastMessage = buildLastMessagePreview(getLastMessageForConversation(mockDirectDayGroups));
// const mockGroupLastMessage = buildLastMessagePreview(getLastMessageForConversation(mockGroupDayGroups), 'Group');

// PINNED CONVERSATIONS
// TO DO: 
// replace localStorage pinning with the BE API (PATCH /conversations/{id}) with { pinned }
// remove loadPinnedIds/savePinnedId and call messagesApi.toggleConversationPin inside togglePin to persist the change
const PINNED_STORAGE_KEY = 'pinnedConversations';

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

// TO DO: remove this block after BE implementation
// const mockUnreadCount = (id: string): number => {
//   let hash = 0;
 
//   for (let i = 0; i < id.length; i += 1) {
//     hash = (hash * 31 + id.charCodeAt(i)) | 0;
//   }
 
//   return Math.abs(hash) % 5;
// };

export interface AddConversationInput {
  participantIds: string[];
  isGroup: boolean;
  groupName?: string;
}

export const useConversations = () => {
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

    setLoading(true);
    setError(null);

    messagesApi
      .getAllConversations()
      .then((response) => {
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

  // TO DO: 
  // replace mock group conversations with real groups returned by API (GET /conversations)
  // >>>>>>>>>>>>>>> MOCK >>>>>>>>>>>>>>>>>>
  // const { groupMessages, loading: groupsLoading } = useGroupMessages({ users });
  // >>>>>>>>>>>>>>> END OF MOCK >>>>>>>>>>>>>>>>>>

  const [conversations, setConversations] = useState<Conversation[]>([]);
  // const [pinnedIds, setPinnedIds] = useState<Set<string>>(loadPinnedIds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // >>>>>>>>>>>>>>> REAL API (uncomment once BE route is ready)
  const groupMessages = useMemo(
    () => conversations.filter((conversation) => conversation.type === 'group'),
    [conversations],
  );
  // >>>>>>>>>>>>>>> END REAL API 

  // TO DO:
  // currently these are mocks 
  // delete this entirely, API (GET /conversations) will simply return the threads that actually exist
  // >>>>>>>>>>>>>>> MOCK >>>>>>>>>>>>>>>>>>
  // const usersWithMockConversation = useMemo(() => {
  //   const shuffled = [...users].sort(() => Math.random() - 0.5);
  //   const half = shuffled.slice(0, Math.ceil(shuffled.length / 2));

  //   return new Set(half.map((user) => user.userId));
  // }, [users.length]); 

  // const buildDirectConversations = useCallback(
  //   (usersToBuild: User[]): Conversation[] => {
  //     return usersToBuild
  //       .filter((user) => usersWithMockConversation.has(user.userId))
  //       .map((user) => {
  //         const profile = toProfile(user);
  //         const id = `user-${user.userId}`;

  //         return {
  //           id,
  //           userId: user.userId,
  //           name: profile.name,
  //           type: 'direct',
  //           status: profile.status,
  //           avatarUrl: profile.avatarUrl,
  //           pinned: pinnedIds.has(id),
  //           createdAt: new Date().toISOString(),
  //           updatedAt: undefined,
  //           lastMessage: mockDirectLastMessage,
	// 		unreadCount: mockUnreadCount(id),
  //         };
  //       });
  //   },
  //   [pinnedIds, usersWithMockConversation],
  // );

  // const buildGroupConversations = useCallback((): Conversation[] => {
  //   return groupMessages.map((group) => {
  //     const id = `group-${group.id}`;
  //     const members = group.members.slice(0, 5).map(toProfile);

  //     return {
  //       id,
  //       name: group.name,
  //       type: 'group',
  //       members,
  //       pinned: pinnedIds.has(id),
  //       createdAt: new Date().toISOString(),
  //       updatedAt: undefined,
  //       lastMessage: mockGroupLastMessage,
	// 	unreadCount: mockUnreadCount(id),
  //     };
  //   });
  // }, [groupMessages, pinnedIds]);

  // useEffect(() => {
  //   if (!currentUser || usersLoading || groupsLoading) {
  //     return;
  //   }

  //   setConversations((previous) => {
  //     const previousById = new Map(previous.map((conversation) => [conversation.id, conversation]));
  //     const initial = [...buildDirectConversations(users), ...buildGroupConversations()];

  //     return initial.map((conversation) => {
  //       const existing = previousById.get(conversation.id);

  //       return existing
  //         ? { ...conversation, ...existing, pinned: pinnedIds.has(conversation.id) }
  //         : conversation;
  //     });
  //   });

  //   setLoading(false);
  // }, [currentUser, users, usersLoading, groupsLoading, buildDirectConversations, buildGroupConversations, pinnedIds]);
  // >>>>>>>>>>>>>>> END OF MOCK >>>>>>>>>>>>>>>>>>

  // >>>>>>>>>>>>>>> REAL API (uncomment once BE route is ready)
  // useEffect(() => {
  //   if (!currentUser) {
  //     return;
  //   }
  
  //   setLoading(true);
  
  //   messagesApi
  //     .getAllConversations()
  //     .then((response) => {
  //       const fetched: Conversation[] = response;
  
  //       setConversations(fetched);
  //       setLoading(false);
  //     })
  //     .catch((error) => {
  //       setError(error instanceof Error ? error.message : 'Failed to load conversations');
  //       setLoading(false);
  //     });
  // }, [currentUser]);
//   useEffect(() => {
//   if (!currentUser?.userId) {
//     return;
//   }

//   refetch();
// }, [currentUser?.userId]);
  useEffect(() => {
    refetch();
  }, [refetch]);
  // >>>>>>>>>>>>>>>  END REAL API 

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

// TO DO: 
// currently only updates local state, so changes are lost after refresh
// Add API call (POST /conversations/{conversationId}/members) to save new members to the database
// Use messagesApi.addMembers({ conversationId, userIds })
// >>>>>>>>>>>>>>> MOCK >>>>>>>>>>>>>>>>>>
  // const addMembersToConversation = useCallback((conversationId: string, newMembers: Profile[]) => {
  //   setConversations((previous) =>
  //     previous.map((conversation) => {
  //       if (conversation.id !== conversationId) {
  //         return conversation;
  //       }

  //       const existingIds = new Set((conversation.members ?? []).map((member) => member.id));
  //       const toAdd = newMembers.filter((member) => !existingIds.has(member.id));

  //       if (toAdd.length === 0) {
  //         return conversation;
  //       }

  //       return { ...conversation, members: [...(conversation.members ?? []), ...toAdd] };
  //     }),
  //   );
  // }, []);
// >>>>>>>>>>>>>>> END OF MOCK >>>>>>>>>>>>>>>>>>

//   >>>>>>>>>>>>>>> REAL API (uncomment once BE route is ready)
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
  
        return { ...conversation, members: [...(conversation.participants ?? []), ...toAdd] };
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
//   >>>>>>>>>>>>>>> END REAL API 

// TO DO: same as above
// currently only updates local state, so changes are lost after refresh
// Add API call (DELETE /conversations/{conversationId}/members/{userId})
// Use messagesApi.removeMember({ conversationId, userId })
// >>>>>>>>>>>>>>> MOCK >>>>>>>>>>>>>>>>>>
  // const removeMemberFromConversation = useCallback((conversationId: string, userId: string) => {
  //   setConversations((previous) =>
  //     previous.map((conversation) => {
  //       if (conversation.id !== conversationId || !conversation.members) {
  //         return conversation;
  //       }

  //       return { ...conversation, members: conversation.members.filter((member) => member.id !== userId) };
  //     }),
  //   );
  // }, []);
  // >>>>>>>>>>>>>>> END OF MOCK >>>>>>>>>>>>>>>>>>

  // >>>>>>>>>>>>>>> REAL API (uncomment once BE route is ready)
  const removeMemberFromConversation = useCallback((conversationId: string, userId: string) => {
    setConversations((previous) =>
      previous.map((conversation) => {
        if (conversation.conversationId !== conversationId || !conversation.participants) {
          return conversation;
        }
  
        return { ...conversation, members: conversation.participants.filter((member) => member.id !== userId) };
      }),
    );
  
    messagesApi.removeMember(conversationId, userId).catch((error) => {
      console.error('Failed to remove member:', error);
      // revert the optimistic setConversations update above on error.
      // refetch();
    });
  }, [refetch]);
  // >>>>>>>>>>>>>>> END REAL API

// TO DO: 
// currently only removes the conversation locally
// Add API call (DELETE /conversations/{conversationId}) to delete it from the database.
// Use messagesApi.deleteConversation(conversationId)
// >>>>>>>>>>>>>>> MOCK >>>>>>>>>>>>>>>>>>
  // const removeConversation = useCallback((conversationId: string) => {
  //   setConversations((previous) => previous.filter((conversation) => conversation.id !== conversationId));

  //   setPinnedIds((previous) => {
  //     if (!previous.has(conversationId)) {
  //       return previous;
  //     }

  //     const next = new Set(previous);
  //     next.delete(conversationId);
  //     savePinnedIds(next);

  //     return next;
  //   });
  // }, []);
// >>>>>>>>>>>>>>> END OF MOCK >>>>>>>>>>>>>>>>>>

  // >>>>>>>>>>>>>>> REAL API (uncomment once BE route is ready)
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
  // >>>>>>>>>>>>>>> END OF REAL API 

  // >>>>>>>>>>>>>>> MOCK >>>>>>>>>>>>>>>>>>
  // const togglePin = useCallback((id: string) => {
  //   setPinnedIds((previous) => {
  //     const next = new Set(previous);

  //     if (next.has(id)) {
  //       next.delete(id);
  //     } else {
  //       next.add(id);
  //     }

  //     savePinnedIds(next);

  //     return next;
  //   });
  // }, []);
  // >>>>>>>>>>>>>>> END OF MOCK >>>>>>>>>>>>>>>>>>

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
  // // >>>>>>>>>>>>>>> END OF REAL API 

  // TO DO: 
  // currently only clears unreadCount in local state
  // use messagesApi.markConversationRead(conversationId) to persist read status
  // >>>>>>>>>>>>>>> MOCK >>>>>>>>>>>>>>>>>>
  // const markConversationRead = useCallback((conversationId: string) => {
  //   setConversations((previous) =>
  //     previous.map((conversation) =>
  //       conversation.id === conversationId && conversation.unreadCount
  //         ? { ...conversation, unreadCount: 0 }
  //         : conversation,
  //     ),
  //   );
  // }, []);
  // >>>>>>>>>>>>>>> END OF MOCK >>>>>>>>>>>>>>>>>>

  // >>>>>>>>>>>>>>> REAL API (uncomment once BE route is ready)
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
  // >>>>>>>>>>>>>>> END REAL API

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

  // TO DO: replace this artificial delay with an actual API (GET /conversations) 
  // >>>>>>>>>>>>>> MOCK >>>>>>>>>>>>>>>>>>
  // const refetch = useCallback(() => {
  //   setLoading(true);
  //   setError(null);

  //   setTimeout(() => setLoading(false), 500);
  // }, []);
   // >>>>>>>>>>>>>>> END OF MOCK >>>>>>>>>>>>>>>>>>

   // >>>>>>>>>>>>>>> REAL API (uncomment once BE route is ready)

  // >>>>>>>>>>>>>>> END REAL API 
  // console.log('debugging conversations', conversations);

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
    groupMessages, // to remove once BE implemented
    refetch,
  };
};


// TO REMOVE and replace with API
// buildDirectConversations
// buildGroupConversations
// mockDirectLastMessage
// mockGroupLastMessage
// mockDirectDayGroups
// mockGroupDayGroups
// usersWithMockConversation
// useGroupMessages


