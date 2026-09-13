import type { MessageDecoder, MessageEncoder, TrackReferenceOrPlaceholder, WidgetState } from '@livekit/components-core';
import { isEqualTrackRef, isTrackReference, isWeb, log } from '@livekit/components-core';
import { RoomEvent, Track } from 'livekit-client';
import * as React from 'react';
import type { MessageFormatter } from '@livekit/components-react';
import {
  CarouselLayout,
  ConnectionStateToast,
  FocusLayoutContainer,
  GridLayout,
  LayoutContextProvider,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { useCreateLayoutContext } from '@livekit/components-react';
import { usePinnedTracks, useTracks } from '@livekit/components-react';
import { Chat, ControlBar, ParticipantTile, FocusLayout } from '@/features/livekit';
import { Rnd } from "react-rnd";
import { Attendance } from './Attendance';

/**
 * @public
 */
export interface VideoConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  meetId: string;
  isHost: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
  chatMessageFormatter?: MessageFormatter;
  chatMessageEncoder?: MessageEncoder;
  chatMessageDecoder?: MessageDecoder;
  /** @alpha */
  SettingsComponent?: React.ComponentType;
}

/**
 * The `VideoConference` ready-made component is your drop-in solution for a classic video conferencing application.
 * It provides functionality such as focusing on one participant, grid view with pagination to handle large numbers
 * of participants, basic non-persistent chat, screen sharing, and more.
 *
 * @remarks
 * The component is implemented with other LiveKit components like `FocusContextProvider`,
 * `GridLayout`, `ControlBar`, `FocusLayoutContainer` and `FocusLayout`.
 * You can use these components as a starting point for your own custom video conferencing application.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <VideoConference />
 * <LiveKitRoom>
 * ```
 * @public
 */
export function VideoConference({
  meetId,
  isHost,
  onRecordingChange,
  chatMessageFormatter,
  chatMessageDecoder,
  chatMessageEncoder,
  SettingsComponent,
  ...props
}: VideoConferenceProps) {
  const [widgetState, setWidgetState] = React.useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
    showSettings: false,
  });
  
  const [showAttendance, setShowAttendance] = React.useState(false);
  
  const lastAutoFocusedScreenShareTrack = React.useRef<TrackReferenceOrPlaceholder | null>(null);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const widgetUpdate = (state: WidgetState) => {
    log.debug('updating widget state', state);
    setWidgetState(state);
  };

  const layoutContext = useCreateLayoutContext();

  const screenShareTracks = tracks
    .filter(isTrackReference)
    .filter((track) => track.publication.source === Track.Source.ScreenShare);

  const focusTrack = usePinnedTracks(layoutContext)?.[0];
  const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack));

  React.useEffect(() => {
    // If screen share tracks are published, and no pin is set explicitly, auto set the screen share.
    if (
      screenShareTracks.some((track) => track.publication.isSubscribed) &&
      lastAutoFocusedScreenShareTrack.current === null
    ) {
      log.debug('Auto set screen share focus:', { newScreenShareTrack: screenShareTracks[0] });
      layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] });
      lastAutoFocusedScreenShareTrack.current = screenShareTracks[0];
    } else if (
      lastAutoFocusedScreenShareTrack.current &&
      !screenShareTracks.some(
        (track) =>
          track.publication.trackSid ===
          lastAutoFocusedScreenShareTrack.current?.publication?.trackSid,
      )
    ) {
      log.debug('Auto clearing screen share focus.');
      layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
      lastAutoFocusedScreenShareTrack.current = null;
    }
    if (focusTrack && !isTrackReference(focusTrack)) {
      const updatedFocusTrack = tracks.find(
        (tr) =>
          tr.participant.identity === focusTrack.participant.identity &&
          tr.source === focusTrack.source,
      );
      if (updatedFocusTrack !== focusTrack && isTrackReference(updatedFocusTrack)) {
        layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: updatedFocusTrack });
      }
    }
  }, [
    screenShareTracks
      .map((ref) => `${ref.publication.trackSid}_${ref.publication.isSubscribed}`)
      .join(),
    focusTrack?.publication?.trackSid,
    tracks,
  ]);

  return (
    <div 
      className="lk-video-conference" 
      {...props}
    >
      {isWeb() && (
        <LayoutContextProvider
          value={layoutContext}
          // onPinChange={handleFocusStateChange}
          onWidgetChange={widgetUpdate}
        >
          <div className="lk-video-conference-inner flex flex-1 min-w-0 min-h-0">
            {!focusTrack ? (
              <div className="lk-grid-layout-wrapper flex-1 min-w-0 min-h-0">
                <GridLayout
                  key={tracks
                    .map((tr) => `${tr.participant.identity}_${tr.source}_${isTrackReference(tr)}`)
                    .join()}
                  tracks={tracks}
                >
                  <ParticipantTile />
                </GridLayout>
              </div>
            ) : (
              <div className="lk-focus-layout-wrapper flex-1 min-w-0 min-h-0">
                <FocusLayoutContainer>
                  <CarouselLayout tracks={carouselTracks}>
                    <ParticipantTile />
                  </CarouselLayout>
                  {focusTrack && <FocusLayout trackRef={focusTrack} />}
                </FocusLayoutContainer>
              </div>
            )}
            <ControlBar 
              meetId={meetId} 
              onRecordingChange={onRecordingChange}
              controls={{ 
                chat: true, 
                recording: isHost, 
                attendance: isHost,
                settings: !!SettingsComponent 
              }}
              onAttendanceClick={() => setShowAttendance((prev) => !prev)} 
            />
          </div>
          <div
            className="absolute inset-0 pointer-events-none z-30 overflow-hidden"
            style={{
              visibility: widgetState.showChat ? 'visible' : 'hidden',
            }}
          >
            <Rnd
              dragHandleClassName="lk-chat-header"
              cancel=".lk-chat-close, input, textarea, button, select, a, .lk-chat-body, .lk-chat-messages, .lk-chat-form"
              style={{ pointerEvents: widgetState.showChat ? 'auto' : 'none' }} // only the box itself is clickable
              default={{
                x: window.innerWidth < 640 ? 8 : 20,
                y: window.innerWidth < 640 ? 12 : 60,
                width: window.innerWidth < 640 ? Math.min(window.innerWidth - 80, 320) : 320,
                height: window.innerWidth < 640 ? Math.min(window.innerHeight - 180, 420) : 400,
              }}
              minWidth={240}
              minHeight={250}
              maxWidth="100%"
              maxHeight="100%"
              bounds="parent"
            >
              <Chat
                meetId={meetId}
                className="h-full w-full"
                messageFormatter={chatMessageFormatter}
                messageEncoder={chatMessageEncoder}
                messageDecoder={chatMessageDecoder}
              />
            </Rnd>
          </div>

          {/* Attendance */}
          {showAttendance && (
            <Attendance
              meetId={meetId}
              onClose={() => setShowAttendance(false)}
            />
          )}

          {/* Setting */}
          {SettingsComponent && (
            <div
              className="lk-settings-menu-modal"
              style={{ display: widgetState.showSettings ? 'block' : 'none' }}
            >
              <SettingsComponent />
            </div>
          )}
        </LayoutContextProvider>
      )}
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </div>
  );
}