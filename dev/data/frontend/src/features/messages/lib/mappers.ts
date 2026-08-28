import type { User } from '@shared';
import type { Attachment, Conversation, DayGroup, Link, Message, Profile } from '../types';
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

  const name = user.userName || user.userEmail || 'Unknown User';
  const role = user.role?.roleName || user.roleName || 'No role';
  const department = user.department?.dpName || 'No department';
  const departmentId = user.department?.dpId;

  return {
    id: user.userId,
    name,
    email: user.userEmail,
    role,
    department,
    avatarUrl: user.avatarUrl || undefined,
    status: user.userStatus || 'offline',
    departmentId,
    isGroup: false,
  };
}

// GROUP PROFILE
export function toGroupProfile(conversation: Conversation, members: Profile[]): Profile {
  return {
    id: conversation.id,
    name: conversation.name,
    isGroup: true,
    members,
    memberCount: members.length,
    avatarUrl: conversation.avatarUrl,
    status: 'offline',
  };
}

// PERSONALIZE MESSAGES
// TO DO:
// BE to return aithorId and avatar with each message
// remove this block after BE implementation
export function personalizeMessages(
  messages: DayGroup[],
  profile: Profile,
  currentUserName?: string,
  currentUserAvatarUrl?: string,
): DayGroup[] {
  return messages.map((day) => ({
    ...day,
    messages: day.messages.map((message) => ({
      ...message,
      author: message.isSelf ? currentUserName || 'You' : profile.name,
      avatarUrl: message.isSelf ? currentUserAvatarUrl : profile.avatarUrl,
    })),
  }));
}

// PERSONALIZE GROUP MESSAGES
// TO DO: same as above
// BE to return aithorId and avatar with each message
// remove this block after BE implementation
export function personalizeGroupMessages(
  messages: DayGroup[],
  members: Profile[],
  currentUserName?: string,
  currentUserAvatarUrl?: string,
): DayGroup[] {
  const membersById = new Map(members.map((member) => [member.id, member]));

  const fallbackMemberByAuthor = new Map<string, Profile>();
  let nextFallbackIndex = 0;

  return messages.map((day) => ({
    ...day,
    messages: day.messages.map((message) => {
      if (message.isSelf) {
        return { ...message, author: currentUserName || 'You', avatarUrl: currentUserAvatarUrl };
      }

      const matched = message.authorId ? membersById.get(message.authorId) : undefined;

      let member = matched;

      if (!member && members.length > 0) {
        const authorKey = message.author || 'unknown';

        if (!fallbackMemberByAuthor.has(authorKey)) {
          fallbackMemberByAuthor.set(authorKey, members[nextFallbackIndex % members.length]);
          nextFallbackIndex += 1;
        }

        member = fallbackMemberByAuthor.get(authorKey);
      }

      return {
        ...message,
        author: member?.name || message.author || 'Unknown Member',
        avatarUrl: member?.avatarUrl,
      };
    }),
  }));
}

// TO DO: remove after BE implementation, currently used for mock only
export function getLastMessageForConversation(messages: DayGroup[]): Message | undefined {
  if (messages.length === 0) {
    return undefined;
  }

  const lastDay = messages[messages.length - 1];

  if (lastDay.messages.length === 0) {
    return undefined;
  }

  return lastDay.messages[lastDay.messages.length - 1];
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
      const explicitLink: Link[] = message.link
        ? [{ id: `${message.id}-link`, name: getDisplayNameFromUrl(message.link.url), url: message.link.url }]
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

