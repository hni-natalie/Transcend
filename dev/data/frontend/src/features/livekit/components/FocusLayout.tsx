import { ParticipantTile } from '@/features/livekit';
import type { ParticipantClickEvent, TrackReferenceOrPlaceholder } from '@livekit/components-core';

/** @public */
export interface FocusLayoutProps extends React.HTMLAttributes<HTMLElement> {
  /** The track to display in the focus layout. */
  trackRef?: TrackReferenceOrPlaceholder;

  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

/**
 * The `FocusLayout` component is just a light wrapper around the `ParticipantTile` to display a single participant.
 * @public
 */
export function FocusLayout({ trackRef, ...htmlProps }: FocusLayoutProps) {
  return <ParticipantTile trackRef={trackRef} {...htmlProps} />;
}