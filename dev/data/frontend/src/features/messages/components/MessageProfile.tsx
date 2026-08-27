import React, { useEffect, useMemo, useState } from 'react';
import { IconFile, IconImage, IconLink, IconMemberAdd, IconMembers, IconMessagePin, IconOffice } from '@shared';
import type { IconProps } from '@shared';
import type { Attachment, Link, Profile } from '../types';
import { UserRow, SelectToggle, RemoveButton } from './UserRow';
import { ChatAvatar } from './ChatAvatar';
import { useLiveKit } from '@/features/livekit';
import { ROUTE_PATH as R } from '@config/routes.manifest';

interface InvitableGroup {
  id: string;
  name: string;
  memberCount?: number;
  members?: unknown[];
}

interface MessageProfileProps {
  contact: Profile;
  attachments: Attachment[];
  links: Link[];
  isPinned?: boolean;
  onTogglePin?: () => void;
  inviteUsers?: Profile[];
  groupMessages?: InvitableGroup[];
  onInviteUsers?: (userIds: string[]) => void;
  onJoinGroup?: (groupId: string) => void;
  onRemoveMember?: (userId: string) => void;
}

interface ActionButton {
  icon: React.FC<IconProps>;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function MessageProfile({
  contact,
  attachments,
  links,
  isPinned = false,
  onTogglePin,
  inviteUsers = [],
  groupMessages = [],
  onInviteUsers,
  onJoinGroup,
  onRemoveMember,
}: MessageProfileProps) {
  const [activeTab, setActiveTab] = useState<'attachments' | 'links'>('attachments');
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { connect, isConnectedRoom, locateOfficeUser } = useLiveKit("Office");


  useEffect(() => {
    setShowMembers(false);
    setShowInvite(false);
    setSelectedUsers([]);
    setInviteSearch('');
  }, [contact.id]);

  const toggleMembers = () => {
    setShowMembers((previous) => !previous);
    setShowInvite(false);
  };

  const toggleInvite = () => {
    setShowInvite((previous) => !previous);
    setShowMembers(false);
    setSelectedUsers([]);
    setInviteSearch('');
  };

  const availableUsers = useMemo(() => {
    const memberIds = new Set((contact.members || []).map((member) => member.id));

    return inviteUsers.filter((user) => !memberIds.has(user.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [contact.members, inviteUsers]);

  const filteredAvailableUsers = useMemo(() => {
    if (!inviteSearch.trim()) {
      return availableUsers;
    }

    const query = inviteSearch.toLowerCase();

    return availableUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query) ||
        user.department?.toLowerCase().includes(query),
    );
  }, [availableUsers, inviteSearch]);

  const filteredGroupMessages = useMemo(() => {
    if (!inviteSearch.trim()) {
      return groupMessages;
    }

    const query = inviteSearch.toLowerCase();

    return groupMessages.filter((group) => group.name.toLowerCase().includes(query));
  }, [groupMessages, inviteSearch]);

  const handleToggleSelect = (userId: string) => {
    setSelectedUsers((previous) => (previous.includes(userId) ? previous.filter((id) => id !== userId) : [...previous, userId]));
  };

  const handleInviteUsers = () => {
    if (selectedUsers.length === 0) {
      return;
    }

    onInviteUsers?.(selectedUsers);

    setShowInvite(false);
    setSelectedUsers([]);
    setInviteSearch('');
  };

  const handleJoinGroup = (groupId: string) => {
    onJoinGroup?.(groupId);

    setShowInvite(false);
    setInviteSearch('');
  };

  const actionButtons: ActionButton[] = [
    { icon: IconMessagePin, label: isPinned ? 'Unpin' : 'Pin', onClick: onTogglePin, isActive: isPinned },
    { icon: IconMemberAdd, label: 'Invite', onClick: toggleInvite, isActive: showInvite },
    contact.isGroup
      ? { icon: IconMembers, label: 'Members', onClick: toggleMembers, isActive: showMembers }
      : { icon: IconOffice, label: 'Locate', onClick: locateOfficeUser(R.USER_OFFICE), isActive: false },
  ];

  const memberCount = contact.memberCount ?? contact.members?.length ?? 0;

  return (
    <aside className="w-[320px] shrink-0 p-6 pt-10 flex flex-col h-full rounded-3xl">
      <div className="text-center mb-6 min-h-[190px]">
        <div className="flex justify-center mb-10">
          <ChatAvatarProxy contact={contact} />
        </div>

        <p className="text-[17px] text-foreground font-semibold mb-3">{contact.name}</p>

        {contact.isGroup ? (
          <p className="text-base text-foreground-2">{memberCount} members</p>
        ) : (
          <>
            <p className="text-[13.5px] text-foreground-2">{contact.role || 'No role'}</p>
            <p className="text-base text-foreground-3">{contact.department || 'No department'}</p>
          </>
        )}
      </div>

      <div className="flex gap-2.5 mt-8 mb-10">
        {actionButtons.map(({ icon: Icon, label, onClick, isActive }) => {
          const isUnpin = label === 'Unpin';

          return (
            <button
              key={label}
              onClick={onClick}
              className={`flex-1 flex flex-col items-center gap-1.5 bg-background-2 rounded-xl py-3 px-1.5 text-[11px] transition-colors cursor-pointer ${
                isActive
                  ? isUnpin
                    ? 'text-foreground-3 hover:bg-background-3 hover:text-foreground'
                    : 'bg-accent-lime-bg text-accent-lime'
                  : 'text-foreground-3 hover:bg-background-3 hover:text-foreground'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </button>
          );
        })}
      </div>

      {showInvite && (
        <div className="flex flex-col flex-1 min-h-0 mb-2">
          <div className="flex bg-background-2 rounded-xl mb-2 shrink-0">
            <div className="flex-1 py-2 text-base font-medium text-center rounded-lg bg-accent-lime-bg text-accent-lime">
              {contact.isGroup ? 'Invite Users' : 'Invite to Group'}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {contact.isGroup ? (
              filteredAvailableUsers.length === 0 ? (
                <div className="text-center text-foreground-3 text-sm py-4">No users available to add</div>
              ) : (
                filteredAvailableUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    name={user.name}
                    email={user.email}
                    avatarUrl={user.avatarUrl}
                    subtitle={`${user.role ?? 'No role'} · ${user.department ?? 'No department'}`}
                    selected={selectedUsers.includes(user.id)}
                    trailing={
                      <SelectToggle
                        selected={selectedUsers.includes(user.id)}
                        onToggle={() => handleToggleSelect(user.id)}
                      />
                    }
                  />
                ))
              )
            ) : filteredGroupMessages.length === 0 ? (
              <div className="text-center text-foreground-3 text-sm py-4">No group chats available</div>
            ) : (
              filteredGroupMessages.map((group) => (
                <UserRow
                  key={group.id}
                  name={group.name}
                  subtitle={`${group.memberCount} members`}
                  trailing={
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleJoinGroup(group.id);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer bg-background-3 text-foreground-3 opacity-0 group-hover:opacity-100 hover:bg-accent-lime/20 shrink-0"
                    >
                      <IconMemberAdd className="w-4 h-4" />
                    </button>
                  }
                />
              ))
            )}
          </div>

          {contact.isGroup && (
            <div className="flex justify-end gap-2 mt-3 shrink-0">
              <button
                onClick={handleInviteUsers}
                disabled={selectedUsers.length === 0}
                className={`w-[90px] btn-lime-outline py-2 text-base rounded-3xl ${
                  selectedUsers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Add {selectedUsers.length > 0 && `(${selectedUsers.length})`}
              </button>
            </div>
          )}
        </div>
      )}

      {showMembers && contact.isGroup && contact.members && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex bg-background-2 rounded-xl mb-3.5 shrink-0">
            <div className="flex-1 py-2 text-base font-medium text-center rounded-lg bg-accent-lime-bg text-accent-lime">
              All Members
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {contact.members.map((member) => (
              <UserRow
                key={member.id}
                name={member.name}
                email={member.email}
                avatarUrl={member.avatarUrl}
                subtitle={`${member.role ?? 'No role'} · ${member.department ?? 'No department'}`}
                trailing={onRemoveMember && <RemoveButton label={`Remove ${member.name}`} onClick={() => onRemoveMember(member.id)} />}
              />
            ))}
          </div>
        </div>
      )}

      {!(showMembers || showInvite) && (
        <>
          <div className="flex bg-background-2 rounded-xl mb-4">
            <button
              onClick={() => setActiveTab('attachments')}
              className={`flex-1 py-2 text-base font-medium transition-colors cursor-pointer rounded-lg ${
                activeTab === 'attachments' ? 'bg-accent-lime-bg text-accent-lime' : 'text-foreground-3 hover:text-foreground'
              }`}
            >
              Attachments
            </button>

            <button
              onClick={() => setActiveTab('links')}
              className={`flex-1 py-2 text-base font-medium transition-colors cursor-pointer rounded-lg ${
                activeTab === 'links' ? 'bg-accent-lime-bg text-accent-lime' : 'text-foreground-3 hover:text-foreground'
              }`}
            >
              Links
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
            {activeTab === 'attachments' ? (
              <div className="space-y-3">
                {attachments.length === 0 ? (
                  <p className="text-center text-foreground-3 text-sm py-8">No attachments</p>
                ) : (
                  attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between gap-3 bg-background-1 border border-border rounded-xl px-4 py-2.5"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {attachment.kind === 'pdf' ? (
                          <IconFile className="text-foreground-3 shrink-0 w-[18px] h-[18px]" />
                        ) : (
                          <IconImage className="text-foreground-3 shrink-0 w-[18px] h-[18px]" />
                        )}

                        <div className="min-w-0">
                          <p className="text-[13.5px] text-foreground text-left truncate">{attachment.name}</p>
                          <p className="text-[11.5px] text-foreground-3 text-left">
                            {new Date(attachment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11.5px] text-foreground-3 shrink-0">{attachment.size}</span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {links.length === 0 ? (
                  <p className="text-center text-foreground-3 text-sm py-8">No links</p>
                ) : (
                  links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-2.5 bg-background-1 border border-border rounded-xl px-3.5 py-2.5 cursor-pointer hover:bg-background-2 transition-colors"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      <IconLink className="text-foreground-3 shrink-0 w-[18px] h-[18px]" />

                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] text-foreground text-left truncate">{link.name}</p>
                        <p className="text-[11.5px] text-foreground-3 text-left truncate">{link.url}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

function ChatAvatarProxy({ contact }: { contact: Profile }) {
  return (
    <ChatAvatar
      size="lg"
      status={contact.isGroup ? undefined : contact.status}
      name={contact.name}
      email={contact.email}
      photo={contact.avatarUrl}
      isGroup={contact.isGroup}
    />
  );
}