import * as React from 'react';
import type { MessageFormatter, ReceivedChatMessage } from '@livekit/components-react';
import { cn } from '@/lib/utils';
import { useChatMessage } from './hooks/utils';

export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {
  /** The chat massage object to display. */
  entry: ReceivedChatMessage;
  /** Hide sender name. Useful when displaying multiple consecutive chat messages from the same person. */
  hideName?: boolean;
  /** Hide message timestamp. */
  hideTimestamp?: boolean;
  /** An optional formatter for the message body. */
  messageFormatter?: MessageFormatter;
}

export const ChatEntry = ({
  entry,
  messageFormatter,
  hideName,
  hideTimestamp,
  className,
  ...props
}: ChatEntryProps) => {
  const { message, hasBeenEdited, time, locale, name } = useChatMessage(entry, messageFormatter);

  const isUser = entry.from?.isLocal ?? false;
  const messageOrigin = isUser ? 'remote' : 'local';

  // Check if message contains image upload indicator
  const isImageMessage = typeof message === 'string' && message.includes('[Image:');
  const imageInfo =
    isImageMessage && typeof message === 'string'
      ? message.match(/\[Image: (.+?), Size: (.+?)\]/)
      : null;

  return (
    <li
      data-lk-message-origin={messageOrigin}
      title={time.toLocaleTimeString(locale, { timeStyle: 'full' })}
      className={cn('group flex flex-col gap-0.5', className)}
      {...props}
    >
      {(!hideTimestamp || !hideName || hasBeenEdited) && (
        <span className="flex text-sm text-gray-600">
          {!hideName && <strong className="mt-2 text-black">{name}</strong>}

          {!hideTimestamp && (
            <span className="align-self-end ml-auto font-mono text-xs text-gray-500 opacity-0 transition-opacity ease-linear group-hover:opacity-100">
              {hasBeenEdited && '*'}
              {time.toLocaleTimeString(locale, { timeStyle: 'short' })}
            </span>
          )}
        </span>
      )}

      <div
        className={cn(
          'max-w-4/5 rounded-[20px] p-2 text-black',
          isUser
            ? 'ml-auto border border-blue-200 bg-blue-100'
            : 'mr-auto border border-gray-200 bg-white'
        )}
      >
        {isImageMessage && imageInfo ? (
          <div className="space-y-2">
            {/* Image upload indicator */}
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2 text-sm">
              <span className="text-lg">📷</span>
              <div>
                <div className="font-medium text-blue-700">Image uploaded: {imageInfo[1]}</div>
                <div className="text-xs text-blue-600">
                  Size: {imageInfo[2]} • Processing your complaint...
                </div>
              </div>
            </div>
            {/* Show the message content without the image tag */}
            <div className="whitespace-pre-wrap text-black">
              {typeof message === 'string' ? message.replace(/\[Image: .+?\]/, '').trim() : message}
            </div>
          </div>
        ) : (
          <span className="whitespace-pre-wrap text-black">{message}</span>
        )}
      </div>
    </li>
  );
};
