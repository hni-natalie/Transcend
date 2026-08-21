import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { ErrorState, Modal, useUsers } from '@shared';
import type { User } from '@shared';
import { Sidebar, MessageHeader, MessageList, Composer, MessageProfile } from './components';
import { FormNewMessage } from './form/FormNewMessage';
import { useProfile, useCreateConversation, useConversations, useMessages } from './hooks';
import type { CreateConversationInput } from './hooks';
import type { Attachment, Conversation, Message, UploadedAttachment } from './types';
import { buildLastMessagePreview, extractAttachmentsFromDayGroups, extractLinksFromDayGroups, toGroupProfile, toProfile, mapConversationsToInvitableGroups } from './lib/mappers';

interface MessagingProps {
  showAddForm: boolean;
  onCloseAddForm: () => void;
}

export default function Messaging({ showAddForm, onCloseAddForm }: MessagingProps) {
  const { isOpen: isInfoOpen, toggle: toggleInfo } = useProfile(true);
  const { user: currentUser } = useAuth();
  const { users, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers({
    excludeCurrentUser: true, 
  });

  const {
    pinned: pinnedConversations,
    recent: recentConversations,
    all: allConversations,
    loading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
    togglePin,
	markConversationRead,
    addConversation,
    updateConversationLastMessage,
    addMembersToConversation,
    removeMemberFromConversation,
    removeConversation,
    existingConversationUserIds,
    groupMessages,
  } = useConversations();

  const { createConversation, isCreating } = useCreateConversation();

  const [newConversationIds, setNewConversationIds] = useState<Set<string>>(new Set());
  const [selectedConversation, setSelectedConversation] = useState<{ id: string; type: 'direct' | 'group' }>({
    id: '',
    type: 'direct',
  });
  const [conversationPendingDeletion, setConversationPendingDeletion] = useState<Conversation | null>(null);

  const filteredUsers = users;

  const usersById = useMemo(() => new Map(filteredUsers.map((user) => [user.userId, user])), [filteredUsers]);

  //auto select first conversation
  useEffect(() => {
    if (allConversations.length === 0) {
      return;
    }

    const selectedStillExists =
      selectedConversation.id && allConversations.some((conversation) => conversation.conversationId === selectedConversation.id);

    if (selectedStillExists) {
      return;
    }

    const firstConversation = allConversations[0];
    // console.log('debugging first conversationinfo: ', firstConversation)

    setSelectedConversation({ id: firstConversation.conversationId, type: firstConversation.type });
    // console.log('debugging: check conversationid', firstConversation.conversationId)
    markConversationRead(firstConversation.conversationId);
  }, [allConversations, selectedConversation.id, markConversationRead]);

  const isSelectedNew = newConversationIds.has(selectedConversation.id);

  const { messages: conversationMessages, sendMessage } = useMessages({
    conversationId: selectedConversation.id || undefined,
    kind: selectedConversation.type
  });

  // useEffect(() => {
  //   loadIfNeeded();
  // }, [selectedConversation.id, selectedConversation.type, isSelectedNew, loadIfNeeded]);

  const currentAttachments = useMemo(() => extractAttachmentsFromDayGroups(conversationMessages), [conversationMessages]);
  const currentLinks = useMemo(() => extractLinksFromDayGroups(conversationMessages), [conversationMessages]);

  const currentChat = useMemo(() => {
    const selected = allConversations.find((conversation) => conversation.conversationId === selectedConversation.id);


    if (!selected) {
      return null;
    }

    if (selected.type === 'group') {
      const members = selected.participants ?? [];

      return {
        profile: toGroupProfile(selected, members),
        // messages: isSelectedNew ? [] : personalizeGroupMessages(conversationMessages, members, currentUser?.userName, currentUser?.avatarUrl ?? undefined),
        messages: conversationMessages,
        attachments: isSelectedNew ? [] : currentAttachments,
        links: isSelectedNew ? [] : currentLinks,
      };
    }

    const selectedUser = selected.userId ? usersById.get(selected.userId) : undefined;
    const profile = toProfile(selectedUser);

    if (!selectedUser) {
      return null;
    }

    return {
      profile,
      // messages: isSelectedNew ? [] : personalizeMessages(conversationMessages, profile, currentUser?.userName, currentUser?.avatarUrl ?? undefined),
      messages: conversationMessages,
      attachments: isSelectedNew ? [] : currentAttachments,
      links: isSelectedNew ? [] : currentLinks,
    };
  }, [allConversations, selectedConversation.id, usersById, conversationMessages, currentUser?.userName, currentAttachments, currentLinks, isSelectedNew]);

  // console.log('debuggingg current chat profile:', currentChat?.profile);

  // const handleCreateConversation = async (data: CreateConversationInput & { message?: string }) => {
  //   try {
  //     const created = await createConversation(data);

  //     const usersForConversation = data.participantIds
  //       .map((id) => filteredUsers.find((user) => user.userId === id))
  //       .filter((user): user is User => Boolean(user));

  //     const now = new Date().toISOString();

  //     const conversation: Conversation = {
  //       conversationId: created.conversationId,
  //       name: data.isGroup ? data.groupName || 'New Group' : usersForConversation[0]?.userName || usersForConversation[0]?.userEmail || 'New Conversation',
  //       type: data.isGroup ? 'group' : 'direct',
  //       userId: data.isGroup ? undefined : data.participantIds[0],
  //       participants: data.isGroup ? usersForConversation.map(toProfile) : undefined,
  //       userStatus: data.isGroup ? undefined : usersForConversation[0]?.userStatus || 'offline',
  //       avatarUrl: data.isGroup ? undefined : usersForConversation[0]?.avatarUrl || undefined,
  //       pinned: false,
  //       lastMessage: undefined,
  //       createdAt: created.createdAt || now,
  //       updatedAt: data.message ? now : undefined,
  //     };

  //     addConversation(conversation);

  //     setNewConversationIds((previous) => new Set(previous).add(conversation.conversationId));

  //     setSelectedConversation({ id: conversation.conversationId, type: conversation.type });

  //     if (data.message) {
  //       updateConversationLastMessage(conversation.conversationId, {
  //         text: data.message,
  //         author: currentUser?.userName || 'You',
  //         createdAt: now,
  //       });
  //     }

  //     onCloseAddForm();
  //   } catch (error) {
  //     console.error('Failed to create conversation:', error);
  //   }
  // };
  const handleCreateConversation = async ( data: CreateConversationInput & { message?: string }) => {
    try {
      const created = await createConversation(data);

      // created is already a complete mapped Conversation
      addConversation(created);

      setNewConversationIds((previous) =>
        new Set(previous).add(created.conversationId)
      );

      setSelectedConversation({
        id: created.conversationId,
        type: created.type,
      });

      if (data.message) {
        const now = new Date().toISOString();

        updateConversationLastMessage(created.conversationId, {
          text: data.message,
          author: currentUser?.userName || 'You',
          createdAt: now,
        });
      }

      onCloseAddForm();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation({ id: conversation.conversationId, type: conversation.type });
	markConversationRead(conversation.conversationId);
  };

  const handleInviteUsersToGroup = (userIds: string[]) => {
    if (!selectedConversation.id) {
      return;
    }

    const invited = filteredUsers.filter((user) => userIds.includes(user.userId)).map(toProfile);

    addMembersToConversation(selectedConversation.id, invited);
  };

  const handleJoinGroup = (groupId: string) => {
    if (!currentChat || currentChat.profile.isGroup) {
      return;
    }

    addMembersToConversation(`group-${groupId}`, [currentChat.profile]);
  };

  const handleRemoveMember = (userId: string) => {
    if (!selectedConversation.id) {
      return;
    }

    removeMemberFromConversation(selectedConversation.id, userId);
  };

  const handleRequestDeleteConversation = (conversation: Conversation) => {
    setConversationPendingDeletion(conversation);
  };

  const handleConfirmDeleteConversation = () => {
    if (!conversationPendingDeletion) {
      return;
    }
    removeConversation(conversationPendingDeletion.conversationId);
    setConversationPendingDeletion(null);
  };

  const handleSendMessage = (text: string, attachments?: UploadedAttachment[]) => {
    console.log('DEBUGGING FE attachments before sending:', attachments);
    if (!selectedConversation.id || (!text.trim() && !attachments?.length)) {
      return;
    }

    const now = new Date();

    // const newMessage: Message = {
    //   id: `msg-${Date.now()}`,
    //   conversationId: selectedConversation.id,
    //   author: currentUser?.userName || 'You',
    //   authorId: currentUser?.userId || undefined,
    //   isSelf: true,
    //   createdAt: now.toISOString(),
    //   text: text.trim() || undefined,
    //   attachments,
    // };

    sendMessage({text: text.trim() || undefined, attachments});
    updateConversationLastMessage(
      selectedConversation.id,
      {
        text: text.trim() || 'Attachment',
        author: currentUser?.userName || 'You',
        createdAt: now.toISOString(),
      }
    );
    
    setNewConversationIds((previous) => {
      if (!previous.has(selectedConversation.id)) {
        return previous;
      }

      const next = new Set(previous);
      next.delete(selectedConversation.id);
      return next;
    });
  };

  const error = usersError || conversationsError;
  const isLoading = usersLoading || conversationsLoading || isCreating;

  const handleRefetch = () => {
    refetchUsers();
    refetchConversations();
  };

  if (error) {
    return <ErrorState error={error} onRetry={handleRefetch} size="full" className="h-full" />;
  }

  return (
    <>
      <div className="flex h-full w-full bg-background overflow-hidden">
        <Sidebar
          onConversationSelect={handleConversationSelect}
          activeConversationId={selectedConversation.id}
          pinnedConversations={pinnedConversations}
          recentConversations={recentConversations}
          isLoading={isLoading}
          onDeleteRequest={handleRequestDeleteConversation}
        />

        <main className="flex flex-col flex-1 min-w-0 bg-background-1 rounded-3xl my-4 shadow-lg overflow-visible">
          {currentChat ? (
            <>
              <MessageHeader contact={currentChat.profile} isInfoOpen={isInfoOpen} onToggleInfo={toggleInfo} />

              <MessageList dayGroups={currentChat.messages} />

              <Composer
                contactName={currentChat.profile.isGroup ? 'group' : currentChat.profile.name}
                conversationId={selectedConversation.id}
                onSend={handleSendMessage}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-foreground-3">
              {isLoading ? 'Loading conversations...' : 'Select a conversation to start messaging'}
            </div>
          )}
        </main>

        {isInfoOpen && currentChat && (
          <div className="bg-background-1 rounded-3xl my-4 shadow-lg ml-4 overflow-hidden self-stretch min-h-0">
            <MessageProfile
              contact={currentChat.profile}
              attachments={currentChat.attachments}
              links={currentChat.links}
              inviteUsers={filteredUsers.map(toProfile)}
              groupMessages={mapConversationsToInvitableGroups(allConversations)}
              onInviteUsers={handleInviteUsersToGroup}
              onJoinGroup={handleJoinGroup}
              onRemoveMember={handleRemoveMember}
              isPinned={pinnedConversations.some((conversation) => conversation.conversationId === selectedConversation.id)}
              onTogglePin={() => togglePin(selectedConversation.id)}
            />
          </div>
        )}
      </div>

      <Modal isOpen={showAddForm} onClose={onCloseAddForm}>
        <FormNewMessage
          users={filteredUsers}
          isLoading={isLoading}
          onClose={onCloseAddForm}
          onSuccess={() => undefined}
          onCreateConversation={handleCreateConversation}
          existingConversationUserIds={existingConversationUserIds}
        />
      </Modal>

      <Modal isOpen={Boolean(conversationPendingDeletion)} onClose={() => setConversationPendingDeletion(null)}>
        <div className="bg-background-1 rounded-3xl p-6 shadow-2xl w-[340px]">
          <p className="text-base text-foreground mb-1">
            Delete conversation with <span className="font-semibold">{conversationPendingDeletion?.name}</span>?
          </p>
          <p className="text-sm text-foreground-3 mb-6">This conversation will be deleted. Are you sure?</p>

          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setConversationPendingDeletion(null)}
              className="px-4 py-2 text-base rounded-full text-foreground-3 hover:text-foreground hover:bg-background-2 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmDeleteConversation}
              className="px-4 py-2 text-base rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}