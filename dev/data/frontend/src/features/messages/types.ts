import type { UserBackendStatus } from '@shared';

export interface Profile {
  id: string;
  name: string;
  email?: string;
  role?: string;
  department?: string;
  avatarUrl?: string;
  status?: UserBackendStatus;
  isGroup?: boolean;
  members?: Profile[];
  memberCount?: number;
}

export interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'group';
  pinned?: boolean;
  userId?: string;
  members?: Profile[];
  status?: UserBackendStatus;
  avatarUrl?: string;
  lastMessage?: LastMessage;
  unreadCount?: number;
  createdAt: string;
  updatedAt?: string;
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
  link?: { url: string }; // later remove after BE
//   linkUrl?: string; // uncommment for BE
  attachments?: Attachment[];
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

export interface Link {
  id: string;
  name: string;
  url: string;
}


