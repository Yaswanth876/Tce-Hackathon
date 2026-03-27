'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import { Track } from 'livekit-client';
import { BarVisualizer, useRemoteParticipants } from '@livekit/components-react';
import { ChatTextIcon, ImageIcon, PhoneDisconnectIcon } from '@phosphor-icons/react/dist/ssr';
import { ChatInput } from '@/components/livekit/chat/chat-input';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { Toggle } from '@/components/ui/toggle';
import { AppConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DeviceSelect } from '../device-select';
import { TrackToggle } from '../track-toggle';
import { UseAgentControlBarProps, useAgentControlBar } from './hooks/use-agent-control-bar';

export interface AgentControlBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    UseAgentControlBarProps {
  capabilities: Pick<AppConfig, 'supportsChatInput' | 'supportsVideoInput'>;
  onChatOpenChange?: (open: boolean) => void;
  onSendMessage?: (message: string) => Promise<void>;
  onImageUpload?: (file: File, previewUrl: string) => Promise<void>;
  onDisconnect?: () => void;
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
}

/**
 * A control bar specifically designed for voice assistant interfaces
 */
export function AgentControlBar({
  controls,
  saveUserChoices = true,
  capabilities,
  className,
  onSendMessage,
  onImageUpload,
  onChatOpenChange,
  onDisconnect,
  onDeviceError,
  ...props
}: AgentControlBarProps) {
  const participants = useRemoteParticipants();
  const [chatOpen, setChatOpen] = React.useState(false);
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const isAgentAvailable = participants.some((p) => p.isAgent);
  const isInputDisabled = !chatOpen || !isAgentAvailable || isSendingMessage;

  const [isDisconnecting, setIsDisconnecting] = React.useState(false);

  const {
    micTrackRef,
    visibleControls,
    cameraToggle,
    microphoneToggle,
    handleAudioDeviceChange,
    handleVideoDeviceChange,
    handleDisconnect,
  } = useAgentControlBar({
    controls,
    saveUserChoices,
  });

  const handleSendMessage = async (message: string) => {
    setIsSendingMessage(true);
    try {
      await onSendMessage?.(message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleImageUpload = async (file: File, previewUrl: string) => {
    setIsUploadingImage(true);
    try {
      await onImageUpload?.(file, previewUrl);
      setImageUploadOpen(false); // Close upload area after successful upload
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onLeave = async () => {
    setIsDisconnecting(true);
    await handleDisconnect();
    setIsDisconnecting(false);
    onDisconnect?.();
  };

  React.useEffect(() => {
    onChatOpenChange?.(chatOpen);
  }, [chatOpen, onChatOpenChange]);

  const onMicrophoneDeviceSelectError = useCallback(
    (error: Error) => {
      onDeviceError?.({ source: Track.Source.Microphone, error });
    },
    [onDeviceError]
  );
  const onCameraDeviceSelectError = useCallback(
    (error: Error) => {
      onDeviceError?.({ source: Track.Source.Camera, error });
    },
    [onDeviceError]
  );

  return (
    <div
      aria-label="Voice assistant controls"
      className={cn(
        'flex flex-col rounded-[31px] border-2 border-blue-300 bg-white p-3 shadow-lg',
        className
      )}
      {...props}
    >
      {capabilities.supportsChatInput && (
        <div
          inert={!chatOpen}
          className={cn(
            'overflow-hidden transition-[height] duration-300 ease-out',
            chatOpen ? 'h-[57px]' : 'h-0'
          )}
        >
          <div className="flex h-8 w-full">
            <ChatInput
              onSend={handleSendMessage}
              disabled={isInputDisabled}
              className="w-full border-blue-300 bg-white text-black"
            />
          </div>
          <hr className="my-3 border-blue-200" />
        </div>
      )}

      {/* Image Upload Area */}
      <div
        className={cn(
          'overflow-hidden transition-[height] duration-300 ease-out',
          imageUploadOpen ? 'h-auto' : 'h-0'
        )}
      >
        <div className="py-3">
          <ImageUpload
            onImageUpload={handleImageUpload}
            disabled={!isAgentAvailable || isUploadingImage}
            className="w-full"
          />
        </div>
        <hr className="my-3 border-blue-200" />
      </div>

      <div className="flex flex-row justify-between gap-1">
        <div className="flex gap-1">
          {visibleControls.microphone && (
            <div className="flex items-center gap-0">
              <TrackToggle
                variant="primary"
                source={Track.Source.Microphone}
                pressed={microphoneToggle.enabled}
                disabled={microphoneToggle.pending}
                onPressedChange={microphoneToggle.toggle}
                className="peer/track group/track relative w-auto border-blue-500 bg-white pr-3 pl-3 text-black hover:bg-blue-50 md:rounded-r-none md:border-r-0 md:pr-2"
              >
                <BarVisualizer
                  barCount={3}
                  trackRef={micTrackRef}
                  options={{ minHeight: 5 }}
                  className="flex h-full w-auto items-center justify-center gap-0.5"
                >
                  <span
                    className={cn([
                      'h-full w-0.5 origin-center rounded-2xl',
                      'group-data-[state=on]/track:bg-fg1 group-data-[state=off]/track:bg-destructive-foreground',
                      'data-lk-muted:bg-muted',
                    ])}
                  ></span>
                </BarVisualizer>
              </TrackToggle>
              <hr className="relative z-10 -mr-px hidden h-4 w-px bg-blue-300 peer-data-[state=off]/track:bg-red-300 md:block" />
              <DeviceSelect
                size="sm"
                kind="audioinput"
                requestPermissions={false}
                onMediaDeviceError={onMicrophoneDeviceSelectError}
                onActiveDeviceChange={handleAudioDeviceChange}
                className={cn([
                  'border-blue-500 bg-white pl-2 text-black',
                  'peer-data-[state=off]/track:text-red-600',
                  'hover:bg-blue-50 hover:text-black focus:text-black',
                  'hover:peer-data-[state=off]/track:text-red-600 focus:peer-data-[state=off]/track:text-red-600',
                  'hidden rounded-l-none md:block',
                ])}
              />
            </div>
          )}

          {capabilities.supportsVideoInput && visibleControls.camera && (
            <div className="flex items-center gap-0">
              <TrackToggle
                variant="primary"
                source={Track.Source.Camera}
                pressed={cameraToggle.enabled}
                pending={cameraToggle.pending}
                disabled={cameraToggle.pending}
                onPressedChange={cameraToggle.toggle}
                className="peer/track relative w-auto rounded-r-none border-blue-500 bg-white pr-3 pl-3 text-black hover:bg-blue-50 disabled:opacity-100 md:border-r-0 md:pr-2"
              />
              <hr className="relative z-10 -mr-px hidden h-4 w-px bg-blue-300 peer-data-[state=off]/track:bg-red-300 md:block" />
              <DeviceSelect
                size="sm"
                kind="videoinput"
                requestPermissions={false}
                onMediaDeviceError={onCameraDeviceSelectError}
                onActiveDeviceChange={handleVideoDeviceChange}
                className={cn([
                  'border-blue-500 bg-white pl-2 text-black',
                  'peer-data-[state=off]/track:text-red-600',
                  'hover:bg-blue-50 hover:text-black focus:text-black',
                  'hover:peer-data-[state=off]/track:text-red-600 focus:peer-data-[state=off]/track:text-red-600',
                  'rounded-l-none',
                ])}
              />
            </div>
          )}

          {/* screenshare feature removed */}

          {visibleControls.chat && (
            <Toggle
              variant="secondary"
              aria-label="Toggle chat"
              pressed={chatOpen}
              onPressedChange={setChatOpen}
              disabled={!isAgentAvailable}
              className="aspect-square h-full border-blue-500 bg-white text-black hover:bg-blue-50"
            >
              <ChatTextIcon weight="bold" />
            </Toggle>
          )}

          {/* Image Upload Toggle */}
          <Toggle
            variant="secondary"
            aria-label="Upload image for AI analysis"
            pressed={imageUploadOpen}
            onPressedChange={setImageUploadOpen}
            disabled={!isAgentAvailable || isUploadingImage}
            className="aspect-square h-full border-blue-500 bg-white text-black hover:bg-blue-50"
          >
            <ImageIcon weight="bold" />
          </Toggle>
        </div>
        {visibleControls.leave && (
          <Button
            variant="destructive"
            onClick={onLeave}
            disabled={isDisconnecting}
            className="border-red-500 bg-red-500 font-mono text-white hover:bg-red-600"
          >
            <PhoneDisconnectIcon weight="bold" />
            <span className="hidden md:inline">END CALL</span>
            <span className="inline md:hidden">END</span>
          </Button>
        )}
      </div>
    </div>
  );
}
