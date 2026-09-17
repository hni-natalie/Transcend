import { useEffect } from 'react';
import { MeetingDetails } from '../meeting.types';
import { ModalHeader, getDisplayName } from '@/shared';

type Props = {
  meeting: MeetingDetails | null;
  onClose: () => void;
};

export const MeetingDetailsModal = ({ meeting, onClose }: Props) => {
  if (!meeting) return null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!meeting) return null;

  return (
      <div className='form-layout'>
        <ModalHeader 
            title={meeting.meetTitle}
            onClose={onClose}
        />
        {meeting.meetDesc && (
          <p className="mt-2 text-base text-gray-400">
            {meeting.meetDesc}
          </p>
        )}

        {/* Meeting Information */}
        <div className="rounded-2xl border border-background-3 p-4 space-y-2 mt-2 mb-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Start</span>
            <span>{new Date(meeting.meetStart).toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">End</span>
            <span>{new Date(meeting.meetEnd).toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Participants</span>
            <span>{meeting._count.participants}</span>
          </div>
        </div>

        {/* Participants */}
        <div>
          <h3 className="mb-3 text-base font-semibold">
            Participants
          </h3>

          <div className="space-y-2">
            {meeting.participants.map((participant, index) => (
              <div
                key={index}
                className="flex items-center justify-between task-list-layout"
              >
                {/* <div>
                  <p className="font-medium text-white pb-1">
                    {participant.user.userName}
                  </p>

                  <p className="text-sm text-gray-400">
                    {participant.user.userEmail} 
                  </p>

                  <p className="text-xs text-gray-400 capitalize">
                    {participant.role} 
                  </p>
                </div> */}

				 <div>
                  <p className="font-medium text-white pb-1">
                    {getDisplayName(participant.user)}
                  </p>

                  {!participant.user.deletedAt && (
                    <p className="text-sm text-gray-400">
                      {participant.user.userEmail}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 capitalize">
                    {participant.role} 
                  </p>
                </div>

                <span className={`text-sm font-medium capitalize ${
                  participant.attendance === 'present'
                  ? 'text-accent-lime'
                  : participant.attendance === 'absent'
                  ? 'text-foreground-2'
                  : 'text-foreground-3'
                }`}>
                  {participant.attendance}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
  );
};
