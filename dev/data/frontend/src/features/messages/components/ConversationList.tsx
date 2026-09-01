import React from 'react';
import { EmptyState, LoadingState } from '@shared';
import type { Conversation } from '../types';
import { getConversationPreview } from '../lib/mappers';
import { ChatAvatar } from './ChatAvatar';
import { useSocket } from '@/context/SocketContext';

interface ConversationGroupProps {
  label: string;
  conversations: Conversation[];
  activeConversationId?: string;
  onSelect?: (conversation: Conversation) => void;
  onDeleteRequest?: (conversation: Conversation) => void;
}

function ConversationGroup({ label, conversations, activeConversationId, onSelect, onDeleteRequest }: ConversationGroupProps) {
  const { incomingCalls } = useSocket();

  return (
    <div className="mb-6">
      <p className="px-1 pb-1.5 text-base font-semibold uppercase tracking-wider text-foreground-4">{label}</p>

      <ul className="space-y-0.5">
        {conversations.map((conversation) => {
          const isActive = conversation.conversationId === activeConversationId;
          const hasUnread = (conversation.unreadCount ?? 0) > 0;
          const isRinging = !!conversation.directKey && !!incomingCalls[conversation.directKey];

          return (
            <li
              key={conversation.conversationId}
              onClick={() => onSelect?.(conversation)}
              className={`group flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer transition-colors hover:bg-background-1 ${
                isActive ? 'bg-background-2' : ''
              }`}
            >
              <ChatAvatar
                status={conversation.type === 'group' ? undefined : conversation.userStatus}
                name={conversation.name}
                photo={conversation.avatarUrl}
                isGroup={conversation.type === 'group'}
              />

              <div className="min-w-0 flex-1">
                <p
                  className={`text-[1.1em] truncate ${hasUnread ? 'text-foreground font-semibold' : 'text-foreground'}`}
                >
                  {conversation.name}
                </p>

                <p
                  className={`text-base truncate max-w-[190px] ${
                    hasUnread ? 'text-foreground font-medium' : 'text-foreground-3'
                  }`}
                >
                  {getConversationPreview(conversation)}
                </p>
              </div>
              {isRinging && <p className="pr-2 text-accent-lime text-base font-medium">Calling</p>}

              <div className="relative shrink-0 w-6 h-6 flex items-center justify-center">
                {hasUnread && (
                  <span
                    aria-label={`${conversation.unreadCount} unread messages`}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-accent-lime text-background text-[11px] font-semibold transition-opacity group-hover:opacity-0"
                  >
                    {conversation.unreadCount! > 99 ? '99+' : conversation.unreadCount}
                  </span>
                )}

                {onDeleteRequest && (
                  <button
                    aria-label={`Delete conversation with ${conversation.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteRequest(conversation);
                    }}
                    className="absolute inset-0 rounded-full flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100 text-foreground-3 hover:bg-red-500/20 hover:text-red-400"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface SidebarProps {
  onConversationSelect?: (conversation: Conversation) => void;
  activeConversationId?: string;
  pinnedConversations?: Conversation[];
  recentConversations?: Conversation[];
  isLoading?: boolean;
  onDeleteRequest?: (conversation: Conversation) => void;
}

export function Sidebar({
  onConversationSelect,
  activeConversationId,
  pinnedConversations = [],
  recentConversations = [],
  isLoading = false,
  onDeleteRequest,
}: SidebarProps) {
  const hasAny = pinnedConversations.length > 0 || recentConversations.length > 0;

  if (isLoading) {
    return (
      <aside className="w-[254px] shrink-0 bg-background flex flex-col mt-4 mb-2 mr-4 min-h-0">
        <LoadingState message="Loading conversations..." size="small" className="flex-1" />
      </aside>
    );
  }

  return (
    <aside className="w-[254px] shrink-0 bg-background flex flex-col mt-4 mb-2 mr-4 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-4">
        {!hasAny ? (
          <EmptyState message="No conversations yet" size="small" />
        ) : (
          <>
            {pinnedConversations.length > 0 && (
              <ConversationGroup
                label="Pinned"
                conversations={pinnedConversations}
                activeConversationId={activeConversationId}
                onSelect={onConversationSelect}
                onDeleteRequest={onDeleteRequest}
              />
            )}

            {recentConversations.length > 0 && (
              <ConversationGroup
                label="Recent"
                conversations={recentConversations}
                activeConversationId={activeConversationId}
                onSelect={onConversationSelect}
                onDeleteRequest={onDeleteRequest}
              />
            )}
          </>
        )}
      </div>
    </aside>
  );
}