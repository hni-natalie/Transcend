import { type ChatMessage, type ChatOptions } from '@livekit/components-core';
import * as React from 'react';
import { cloneSingleChild } from '../utils/utils';
import { useMaybeLayoutContext, useChat, ChatToggle, ChatCloseIcon, ChatEntry, MessageFormatter } from '@livekit/components-react';
import { meetingApi } from '@/features/meetings/api/meeting.api';
import { useRoomContext } from '@livekit/components-react';
import { InputTextArea } from '@/shared';

/** @public */
export interface ChatProps extends React.HTMLAttributes<HTMLDivElement>, ChatOptions {
  messageFormatter?: MessageFormatter;
  meetId: string;
}

/**
 * The Chat component provides ready-to-use chat functionality in a LiveKit room.
 * Messages are distributed to all participants in the room in real-time.
 *
 * @remarks
 * - Only users who are in the room at the time of dispatch will receive messages
 * - Message history is not persisted between sessions
 * - Requires `@livekit/components-styles` to be imported for styling
 *
 * @example
 * ```tsx
 * import '@livekit/components-styles';
 *
 * function Room() {
 *   return (
 *     <LiveKitRoom data-lk-theme="default">
 *       <Chat />
 *     </LiveKitRoom>
 *   );
 * }
 * ```
 *
 * For custom styling, refer to: https://docs.livekit.io/reference/components/react/concepts/style-components/
 *
 * @public
 */
export function Chat({
  messageFormatter,
  messageDecoder,
  messageEncoder,
  channelTopic,
  meetId,
  ...props
}: ChatProps) {
  const room = useRoomContext();
  const ulRef = React.useRef<HTMLUListElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const chatOptions: ChatOptions = React.useMemo(() => {
    return { messageDecoder, messageEncoder, channelTopic };
  }, [messageDecoder, messageEncoder, channelTopic]);

  const { chatMessages, send, isSending } = useChat(chatOptions);

  const layoutContext = useMaybeLayoutContext();
  const lastReadMsgAt = React.useRef<ChatMessage['timestamp']>(0);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (inputRef.current && inputRef.current.value.trim() !== '') {
      const message = inputRef.current.value;
      await send(message);

      console.log("Saving chat message:", {
        meetId,
        senderId: room.localParticipant.identity,
        senderName:
          room.localParticipant.name ??
          room.localParticipant.identity,
        message,
      });

      if (meetId) {
        await meetingApi.createChatMessage(
          meetId,
          {
            senderId: room.localParticipant.identity,

            senderName:
              room.localParticipant.name ??
              room.localParticipant.identity,

            message,
          }
        );
    }


    inputRef.current.value = '';
    inputRef.current.style.height = 'auto';
    inputRef.current.focus();
    }
  }

  function handleInputResize(ev: React.FormEvent<HTMLTextAreaElement>) {
    const el = ev.currentTarget;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function handleKeyDown(ev: React.KeyboardEvent<HTMLTextAreaElement>) {
    ev.stopPropagation();
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      handleSubmit(ev as unknown as React.FormEvent);
    }
  }

  React.useEffect(() => {
    if (ulRef) {
      ulRef.current?.scrollTo({ top: ulRef.current.scrollHeight });
    }
  }, [ulRef, chatMessages]);

  React.useEffect(() => {
    if (!layoutContext || chatMessages.length === 0) {
      return;
    }

    if (
      layoutContext.widget.state?.showChat &&
      chatMessages.length > 0 &&
      lastReadMsgAt.current !== chatMessages[chatMessages.length - 1]?.timestamp
    ) {
      lastReadMsgAt.current = chatMessages[chatMessages.length - 1]?.timestamp;
      return;
    }

    const unreadMessageCount = chatMessages.filter(
      (msg) => !lastReadMsgAt.current || msg.timestamp > lastReadMsgAt.current,
    ).length;

    const { widget } = layoutContext;
    if (unreadMessageCount > 0 && widget.state?.unreadMessages !== unreadMessageCount) {
      widget.dispatch?.({ msg: 'unread_msg', count: unreadMessageCount });
    }
  }, [chatMessages, layoutContext?.widget]);

  return (
    <div className="lk-chat-overlay">
      <div {...props} className={`lk-chat-panel ${props.className ?? ''}`}>
        {/* ── Top: title + exit ───────────────────────────── */}
        <div className="lk-chat-header">
          <span className="lk-chat-title">Messages</span>
          {layoutContext && (
            <ChatToggle className="lk-chat-close ml-auto">
              <ChatCloseIcon />
            </ChatToggle>
          )}
        </div>
        
        {/* ── Middle: scrollable message list ────────────────── */}
        <div className="lk-chat-body">
          <ul ref={ulRef} className="lk-chat-messages">
            {chatMessages.map((msg, idx, all) => {
              const hideName = idx >= 1 && all[idx - 1].from === msg.from;
              const hideTimestamp =
                idx >= 1 && all[idx - 1].from === msg.from && msg.timestamp - all[idx - 1].timestamp < 60_000;
 
              return (
                <li key={msg.id ?? idx} className="lk-chat-entry">
                  <div className={`flex gap-1 ${!hideName && !hideTimestamp && idx >= 1 ? 'mt-7!' : ''}`}>

                  <div className='flex flex-col'>
                    {!hideName && (
                      <span className="lk-chat-entry-name">{msg.from?.name ?? 'Unknown'}</span>
                    )}
                    <p className="lk-chat-entry-message">
                      {messageFormatter ? messageFormatter(msg.message) : msg.message}
                    </p>
                  </div>

                  {!hideTimestamp && (
                    <time className="lk-chat-entry-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
 
        {/* ── Bottom: message input ──────────────────────────── */}
        <form className="lk-chat-form" onSubmit={handleSubmit}>
          <InputTextArea
              ref={inputRef}
              className="bg-background-1 border-background-3 focus:border-background-4"
              rows={1}
              disabled={isSending}
              placeholder="Enter a message..."
              onInput={handleInputResize}
              onKeyDown={handleKeyDown}
              onKeyUp={(ev) => ev.stopPropagation()}
          />
          <div>
            <button type="submit" className="btn-header rounded-full" disabled={isSending}>
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
