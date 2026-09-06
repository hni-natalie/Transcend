import React, { useEffect, useMemo, useState } from 'react';
import { EmptyState, IconCamera, IconMessageAdd, IconSearch, LoadingState, User, getDisplayName, getDisplayAvatar } from '@shared';
import { useToast } from '@/context/ToastContext';
import { UserRow } from '../components/UserRow';

interface NewMessageFormProps {
  users: User[];
  isLoading?: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCreateConversation: (data: {
    participantIds: string[];
    isGroup: boolean;
    groupName?: string;
    message?: string;
  }) => Promise<void>;
  defaultRecipientId?: string;
  currentUserId?: string;
  existingConversationUserIds?: Set<string>;
}

export function FormNewMessage({
  users,
  isLoading = false,
  onClose,
  onSuccess,
  onCreateConversation,
  defaultRecipientId,
  existingConversationUserIds = new Set(),
}: NewMessageFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(() => (defaultRecipientId ? [defaultRecipientId] : []));
  const [groupName, setGroupName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const isGroup = selectedUserIds.length > 1;

  const availableUsers = useMemo(
    () => users.filter((user) => !existingConversationUserIds.has(user.userId)),
    [users, existingConversationUserIds],
  );

  const filteredUsers = useMemo(() => {
    let filtered = availableUsers;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      filtered = filtered.filter(
        (user) =>
          user.userName?.toLowerCase().includes(query) ||
          user.userEmail?.toLowerCase().includes(query) ||
          user.role?.roleName?.toLowerCase().includes(query) ||
          user.department?.dpName?.toLowerCase().includes(query),
      );
    }

    return filtered.sort((a, b) => (a.userName || '').localeCompare(b.userName || ''));
  }, [availableUsers, searchQuery]);

  const selectedUsers = useMemo(() => users.filter((user) => selectedUserIds.includes(user.userId)), [users, selectedUserIds]);

  useEffect(() => {
    const input = document.getElementById('search-people');

    if (input) {
      setTimeout(() => input.focus(), 100);
    }
  }, []);

  const handleToggleSelect = (userId: string) => {
    setSelectedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUserIds.length === 0) {
      showToast('error', 'Please select at least one person.');
      return;
    }

    if (isGroup && !groupName.trim()) {
      showToast('error', 'Please enter a name for the group.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreateConversation({
        participantIds: selectedUserIds,
        isGroup,
        groupName: isGroup ? groupName.trim() : undefined,
        message: messageText.trim() || undefined,
      });

      showToast('success', isGroup ? 'Group created successfully!' : 'Conversation started!');
      onSuccess();
      onClose();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to create conversation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative flex items-start gap-4">
        <div className="bg-background-1 rounded-3xl p-6 shadow-2xl w-[368px] h-[200px]">
          <LoadingState message="Loading users..." size="small" className="h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-start gap-4">
      <div
        className="relative bg-background-1 rounded-3xl p-6 pt-10 shadow-2xl flex flex-col w-[368px] h-[650px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center mb-4">
          <IconMessageAdd className="w-7 h-7 text-foreground-2" />
          <h1 className="text-accent-lime font-semibold text-2xl mt-3">New Message</h1>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-foreground-3 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="input-base flex items-center gap-4 focus-within:border-accent-lime pl-4 mt-4">
            <IconSearch className="text-foreground-3 shrink-0 w-4 h-4" />
            <input
              id="search-people"
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-base text-foreground placeholder:text-foreground-3 w-full"
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar mt-4 space-y-0.5">
            {filteredUsers.length === 0 ? (
              <EmptyState
                message={searchQuery ? 'No users found' : 'You already have a conversation with everyone.'}
                size="small"
              />
            ) : (
              filteredUsers.map((user) => (
                <UserRow
                  key={user.userId}
                //   name={user.userName || user.userEmail || 'Unknown User'}
				  name={getDisplayName(user)}
                  email={user.userEmail}
                //   avatarUrl={user.avatarUrl ?? undefined}
				  avatarUrl={getDisplayAvatar(user) ?? undefined}
                  subtitle={`${user.role?.roleName || 'No role'} · ${user.department?.dpName || 'No department'}`}
                  selected={selectedUserIds.includes(user.userId)}
                  onClick={() => handleToggleSelect(user.userId)}
                />
              ))
            )}
          </div>

          {isGroup && (
            <div className="mt-4 p-4 bg-background-2 rounded-2xl border border-border">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-full bg-background-3 flex items-center justify-center border border-border shrink-0 mt-1">
                  <IconCamera className="w-6 h-6 text-foreground-3" strokeWidth={1.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    placeholder="Enter group name..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    maxLength={30}
                    className="pl-2.5 bg-transparent border-b border-border outline-none text-sm text-foreground placeholder:text-foreground-4 w-full pb-1 focus:border-accent-lime transition-colors"
                  />

                  <div className="mt-2 max-h-[75px] overflow-y-auto no-scrollbar">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUsers
                        .slice()
                        .reverse()
                        .map((user) => (
                          <span
                            key={user.userId}
                            className="inline-flex items-center gap-1 bg-background-1 border border-border rounded-full px-2.5 py-1 text-sm text-foreground"
                          >
							{getDisplayName(user)}
                            {/* {user.userName} */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSelect(user.userId);
                              }}
                              className="text-foreground-3 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 mt-auto">
            <button
              type="submit"
              disabled={isSubmitting || selectedUserIds.length === 0}
              className="w-full btn-lime-outline-solid disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : isGroup ? `Create Group (${selectedUserIds.length})` : 'Start Conversation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}