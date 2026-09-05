import type { User } from '@shared';
import { getDisplayName, getDisplayAvatar } from '@shared';
import type { Attachment, Conversation, ConversationResponse, MessageResponse, DayGroup, Link, Message, Profile, InvitableGroup } from '../types';
import { truncate } from './format';
import { extractUrlsFromText, getDisplayNameFromUrl } from './links';

// USER PROFILE
export function toProfile(user?: User): Profile {
  if (!user) {
    return {
      id: 'unknown',
      name: 'Unknown User',
      status: 'offline',
      isGroup: false,
    };
  }

  

//   const name = user.userName || user.userEmail || 'Unknown User';
  const name = getDisplayName(user);
  const role = user.role?.roleName || user.roleName || 'No role';
  const department = user.department?.dpName || 'No department';
  const departmentId = user.department?.dpId;

  return {
    id: user.userId,
    name,
    // email: user.userEmail,
	email: user.deletedAt ? undefined : user.userEmail,
    role,
    department,
    // avatarUrl: user.avatarUrl || undefined,
	avatarUrl: getDisplayAvatar(user) ?? undefined,
    status: user.deletedAt ? 'offline' : (user.userStatus || 'offline'),
    departmentId,
    isGroup: false,
  };
}

// GROUP PROFILE
export function toGroupProfile(conversation: Conversation, members: Profile[]): Profile {
  return {
    id: conversation.conversationId,
    name: conversation.name,
    isGroup: true,
    members,
    memberCount: members.length,
    avatarUrl: conversation.avatarUrl,
    status: 'offline',
  };
}

// LAST MESSAGE PREVIEW
// keep for ui, converts Message into the Conversation.lastMessage format
export function buildLastMessagePreview(
  lastMsg: Message | undefined,
  fallbackAuthor = 'Group',
): Conversation['lastMessage'] {
  if (!lastMsg) {
    return undefined;
  }

  return {
    text: lastMsg.text || lastMsg.callNote || '',
    author: lastMsg.isSelf ? 'You' : fallbackAuthor,
    createdAt: lastMsg.createdAt,
  };
}

// CONVERSATION PREVIEW (for the sidebar list)
// keep for ui, preview formatting
export function getConversationPreview(conversation: Conversation): string {
  if (!conversation.lastMessage) {
    return 'No messages';
  }

  const prefix = conversation.type === 'group' ? `${conversation.lastMessage.author}: ` : '';

  return truncate(`${prefix}${conversation.lastMessage.text}`);
}

// ATTACHMENTS / LINKS
// TO DO: remove after BE implementation, use API instead
export function extractAttachmentsFromDayGroups(dayGroups: DayGroup[]): Attachment[] {
  return dayGroups.flatMap((day) => day.messages.flatMap((message) => message.attachments ?? []));
}

// LINKS
// FE detects URLs inside message.text when sending the message and sends the detected URL to the BE to save in Message.linkUrl
export function extractLinksFromDayGroups(dayGroups: DayGroup[]): Link[] {
  return dayGroups.flatMap((day) =>
    day.messages.flatMap((message) => {
      const explicitLink: Link[] = message.linkUrl
        ? [{ id: `${message.id}-link`, name: getDisplayNameFromUrl(message.linkUrl), url: message.linkUrl }]
        : [];

      const detectedLinks = extractUrlsFromText(message.text).map((url, index) => ({
        id: `${message.id}-text-link-${index}`,
        name: getDisplayNameFromUrl(url),
        url,
      }));

      return [...explicitLink, ...detectedLinks];
    }),
  );
}

// LINKS
// uncomment once BE is implemented, remove above
// export function extractLinksFromDayGroups(dayGroups: DayGroup[]): Link[] {
//   return dayGroups.flatMap((day) =>
//     day.messages.flatMap((message) =>
//       message.linkUrl
//         ? [
//             {
//               id: `${message.id}-link`,
//               name: getDisplayNameFromUrl(message.linkUrl),
//               url: message.linkUrl,
//             },
//           ]
//         : [],
//     ),
//   );
// }
export function mapUserToProfile(
  user: ConversationResponse['participants'][number]['user']
): Profile {
  return {
    id: user.userId,
    // name: user.userName,
	name: getDisplayName(user),
    // avatarUrl: user.avatarUrl ?? undefined,
	avatarUrl: getDisplayAvatar(user) ?? undefined,
    status: user.userStatus ?? 'offline',
    isGroup: false
  };
}

export function messagesToDayGroups(messages: Message[]): DayGroup[] {
  const dayGroupsMap: Record<string, DayGroup> = {};

  messages.forEach((message) => {
    const date = new Date(message.createdAt);
    const dateKey = date.toISOString().split('T')[0];
    const dateLabel = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!dayGroupsMap[dateKey]) {
      dayGroupsMap[dateKey] = {
        id: '',
        label: dateLabel,
        messages: [],
      };
    }
    dayGroupsMap[dateKey].messages.push(message);
  });
  return Object.values(dayGroupsMap).map((group, index) => ({
    ...group,
    id: `group-day-${index + 1}`,
  }))
}

export function mapConversation(conversation: ConversationResponse, currentUserId: string): Conversation {
  const otherParticipant = conversation.participants.find(
    participant => participant.userId !== currentUserId
  );

  const latestMessage = conversation.messages[0];
  // console.log('DEBUGGING Convrersation: ', conversation);

  return {
    conversationId: conversation.conversationId,

    directKey: conversation.directKey ?? undefined,

    name:
      conversation.type === 'group'
        ? conversation.groupName ?? ''
		: (otherParticipant ? getDisplayName(otherParticipant.user) : ''),
        // : otherParticipant?.user.userName ?? '',

    type: conversation.type,

    pinned: conversation.pins.length > 0,

    userId:
      conversation.type === 'direct'
        ? otherParticipant?.userId
        : undefined,

    participants: conversation.participants.map(
      participant => mapUserToProfile(participant.user)
    ),

    userStatus:
      conversation.type === 'direct'
	    ? (otherParticipant?.user.deletedAt ? 'offline' : otherParticipant?.user.userStatus ?? undefined)
        // ? otherParticipant?.user.userStatus ?? undefined
        : undefined,

    avatarUrl:
      conversation.type === 'group'
        ? conversation.avatarUrl ?? undefined
		: (otherParticipant ? getDisplayAvatar(otherParticipant.user) ?? undefined : undefined),
        // : otherParticipant?.user.avatarUrl ?? undefined,

    lastMessage: latestMessage
      ? {
          text: latestMessage.text ?? '',
		  author: getDisplayName(latestMessage.author),
        //   author: latestMessage.author.userName,
          createdAt: latestMessage.createdAt
        }
      : undefined,

    unreadCount: conversation.unreadCount,

    createdAt: conversation.createdAt,

    updatedAt: conversation.updatedAt
  };
}


export function mapMessage(message: MessageResponse, currentUserId: string,): Message {
  return {
    id: message.messageId,
    conversationId: message.conversationId,

    // author: message.author.userName,
	author: getDisplayName(message.author),
    authorId: message.author.userId,
    // avatarUrl: message.author.avatarUrl ?? undefined,
	avatarUrl: getDisplayAvatar(message.author) ?? undefined,

    isSelf: message.author.userId === currentUserId,

    createdAt: message.createdAt,
    text: message.text ?? undefined,

    attachments: message.attachments ?? undefined,
  };
}

export function mapConversationsToInvitableGroups(conversations: Conversation[]): InvitableGroup[] {
  return conversations
    .filter((conversation) => conversation.type === 'group')
    .map((conversation) => ({
      id: conversation.conversationId,
      name: conversation.name,
      memberCount: conversation.participants?.length ?? 0,
      members: conversation.participants ?? [],
    }));
}
