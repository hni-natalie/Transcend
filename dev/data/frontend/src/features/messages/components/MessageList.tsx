import React, { useEffect, useRef } from 'react';
import { IconDownload, IconFile, IconImage, IconPhone } from '@shared';
import type { Attachment, DayGroup, Message } from '../types';
import { ChatAvatar } from './ChatAvatar';
import { formatClockTime } from '../lib/format';
import { splitTextWithLinks, getDisplayNameFromUrl  } from '../lib/links';

interface MessageAttachmentProps {
  attachment: Attachment;
}

export function MessageAttachment({ attachment }: MessageAttachmentProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();

      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.name;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(downloadUrl);
    } 
    catch (error) {
      console.error('Failed to download attachment:', error);
    }
  };

  const getAttachmentIcon = (kind: Attachment['kind']) => {
    return kind === 'image' ? (
      <IconImage className="text-foreground-3 shrink-0 w-[18px] h-[18px]" />
    ) : (
      <IconFile className="text-foreground-3 shrink-0 w-[18px] h-[18px]" />
    );
  };
  return (
    <div className="flex items-center justify-between gap-4 bg-background-1 border border-border rounded-xl px-4 py-3 max-w-[360px] mb-2">
      <div className="flex items-center gap-2.5 min-w-0">

        {getAttachmentIcon(attachment.kind)}

        <div className="min-w-0">
          <p className="text-[1.1em] text-accent-lime truncate">
            {attachment.name}
          </p>

          <p className="text-xs text-foreground-3">
            {attachment.size}
          </p>
        </div>
      </div>

      <button
        onClick={handleDownload}
        aria-label={`Download ${attachment.name}`}
        className="flex p-0.5 text-foreground-3 hover:text-foreground cursor-pointer transition-colors"
      >
        <IconDownload className="w-[17px] h-[17px]" />
      </button>
    </div>
  );
}

function MessageBlock({ message }: { message: Message }) {
  // console.log('debugging: check message object', message.author)
  return (
    <div className="flex gap-3.5 mb-6">
      <ChatAvatar size="ml" name={message.author} photo={message.avatarUrl} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2.5 mb-1.5">
          <span className="text-[1.2em] text-foreground font-semibold">{message.author}</span>
          <span className="text-sm text-foreground-4">{formatClockTime(message.createdAt)}</span>
        </div>

        {message.callNote && (
          <div className="flex items-center gap-2 text-[1.1em] text-foreground-2 mb-2">
            <IconPhone className="text-accent-lime stroke-accent-lime w-[15px] h-[15px]" />
            <span>{message.callNote}</span>
          </div>
        )}

        {message.linkUrl && (
          <a
            // href={message.link.url} // remove after BE
			      href={message.linkUrl} // uncomment for BE
            target="_blank"
            rel="noreferrer"
            className="inline-block text-[1.1em] text-accent-lime hover:underline mb-2"
          >
            {getDisplayNameFromUrl(message.linkUrl)}
			{/* remove above after BE, uncomment below for BE */}
			{/* {getDisplayNameFromUrl(message.linkUrl)} */} 
          </a>
        )}

        {message.attachments?.map((attachment) => (
          <MessageAttachment key={attachment.id} attachment={attachment} />
        ))}

        {message.text && (
          <p className="text-[1.1em] leading-relaxed text-foreground-2">
            {message.text.split('\n').map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {splitTextWithLinks(line).map((part, partIndex) =>
                  part.type === 'url' ? (
                    <a
                      key={partIndex}
                      href={part.value}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent-lime hover:underline"
                    >
                      {part.value}
                    </a>
                  ) : (
                    <React.Fragment key={partIndex}>{part.value}</React.Fragment>
                  ),
                )}
                <br />
              </React.Fragment>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}

interface MessageListProps {
  dayGroups: DayGroup[];
}

export function MessageList({ dayGroups }: MessageListProps) {
  // console.log('debugging: daygroups', dayGroups)

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [dayGroups]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
      {dayGroups.map((day) => (
        <React.Fragment key={day.id}>
          <div className="flex items-center justify-center my-4">
            <span className="bg-background-2 text-foreground-3 text-sm px-3.5 rounded-full">{day.label}</span>
          </div>

          {day.messages.map((message) => (
            <MessageBlock key={message.id} message={message} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}