import type { UserBackendStatus } from '@shared';

export interface Profile {
  id: string;
  name: string;
  email?: string;
  role?: string;
  department?: string;
  departmentId?: string;
  avatarUrl?: string;
  status?: UserBackendStatus;
  isGroup?: boolean;
  members?: Profile[];
  memberCount?: number;
}

export interface Conversation {
  conversationId: string;
  name: string;
  type: 'direct' | 'group';
  pinned?: boolean;

  userId?: string;
  participants?: Profile[];

  userStatus?: UserBackendStatus;
  avatarUrl?: string;
  lastMessage?: LastMessage;

  unreadCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationResponse {
  conversationId: string;

  type: 'direct' | 'group';

  groupName: string | null;

  avatarUrl: string | null;

  pins: {
    userId: string;
  }[];

  participants: {
    userId: string;
    lastReadAt: string | null;

    user: {
      userId: string;
      userName: string;
      avatarUrl: string | null;
      userStatus: UserBackendStatus | null;
    };
  }[];

  messages: {
    messageId: string;
    text: string | null;
    createdAt: string;

    author: {
      userId: string;
      userName: string;
      avatarUrl: string | null;
    };
  }[];

  unreadCount: number;

  createdAt: string;

  updatedAt: string;
}

export interface LastMessage {
  text: string;
  author: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  author: string;
  authorId?: string;
  avatarUrl?: string;
  isSelf: boolean;
  createdAt: string;
  text?: string;
  callNote?: string;
  // link?: { url: string }; // later remove after BE
  linkUrl?: string; // uncommment for BE
  attachments?: Attachment[];
}

export interface MessageResponse {
  messageId: string;
  conversationId: string;
  text: string | null;
  createdAt: string;

  author: {
    userId: string;
    userName: string;
    avatarUrl: string | null;
  };

  attachments?: Attachment[];
}

export interface SendMessageInput {
  text?: string;
  attachments?: UploadedAttachment[];
}

export interface DayGroup {
  id: string;
  label: string;
  messages: Message[];
}

export interface Attachment {
  id: string;
  name: string;
  kind: 'pdf' | 'image' | 'document';
  size: string;
  sizeInBytes?: number;
  url: string;
  path?: string;
  createdAt: string;
  mimeType?: string;
}

export interface UploadedAttachment {
  name: string;
  kind: 'pdf' | 'image' | 'document';
  sizeInBytes: number;
  url: string;
  path: string;
  mimeType: string;
}



export interface Link {
  id: string;
  name: string;
  url: string;
}

export interface InvitableGroup {
  id: string;
  name: string;
  memberCount?: number;
  members?: unknown[];
}