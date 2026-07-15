import { useEffect } from 'react';

export type MeetingDetails = {
  meetTitle: string;
  meetDesc?: string;
  meetStart: string;
  meetEnd: string;
  createdAt: string;
  participants: {
    role: string;
    attendance: string;
    user: {
      userName: string;
    };
  }[];
  _count: {
    participants: number;
  };
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col gap-y-4 w-full max-w-[480px] max-h-[88vh] overflow-y-auto rounded-[1.5rem] bg-[#1b1b1b] border border-[#242424] px-8 py-7 shadow-2xl text-gray-200">

        {/* Close */}
        <button
          onClick={onClose}
          className="close-right"
        >
          ✕
        </button>

        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {meeting.meetTitle}
          </h2>

          {meeting.meetDesc && (
            <p className="mt-2 text-sm text-gray-400">
              {meeting.meetDesc}
            </p>
          )}
        </div>

        {/* Meeting Information */}
        <div className="rounded-xl border border-[#2f2f2f] p-4 space-y-3">
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
                className="flex items-center justify-between rounded-lg border border-[#2f2f2f] bg-[#222222] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">
                    {participant.user.userName}
                  </p>

                  <p className="text-xs text-gray-400 capitalize">
                    {participant.role}
                  </p>
                </div>

                <span className="text-xs text-accent-lime capitalize">
                  {participant.attendance}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
