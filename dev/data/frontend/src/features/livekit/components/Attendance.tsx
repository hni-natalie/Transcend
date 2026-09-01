import * as React from 'react';
import { useMaybeLayoutContext } from '@livekit/components-react';
import { meetingApi } from '@features/meetings';
import { IconClose, InputDropdown, attendanceOptions } from '@/shared';

export type AttendanceStatus = 'present' | 'absent' | 'pending';

export interface AttendanceParticipant {
  userId: string;
  name: string;
  role: 'organiser' | 'participant';
  attendance: AttendanceStatus;
}

export interface AttendanceProps extends React.HTMLAttributes<HTMLDivElement> {
  meetId: string;
  onClose?: () => void;
}

export function Attendance({ meetId, onClose, ...props }: AttendanceProps) {
  const layoutContext = useMaybeLayoutContext();

  const [participants, setParticipants] = React.useState<AttendanceParticipant[]>([]);
  const [attendance, setAttendance] = React.useState<Record<string, AttendanceStatus>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const fetchMeeting = async () => {
      try {
        setIsLoading(true);

        console.log('=== Fetch Meeting ===');
        console.log('meetId:', meetId);

        const response = await meetingApi.getMeetingById(meetId);

        console.log('=== getMeetingById response ===');
        console.log(response);

        const meeting = response.data ?? response;

        console.log('Meeting:', meeting);
        console.log('API participants:', meeting.participants);

        const formattedParticipants: AttendanceParticipant[] =
          meeting.participants.map((participant: any) => ({
            userId: participant.userId,
            name: participant.user.userName,
            role: participant.role,
            attendance: participant.attendance,
          }));

        console.log('Formatted participants:', formattedParticipants);

        setParticipants(formattedParticipants);
        setAttendance(
          Object.fromEntries(
            formattedParticipants.map((participant) => [
              participant.userId,
              participant.attendance,
            ]),
          ),
        );
      } catch (error) {
        console.error('Failed to fetch meeting participants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (meetId) {
      fetchMeeting();
    }
  }, [meetId]);

  const handleAttendanceChange = (
    userId: string,
    status: AttendanceStatus,
  ) => {
    console.log('Attendance changed:', { userId, status });

    setAttendance((prev) => ({
      ...prev,
      [userId]: status,
    }));
  };

  const handleSave = async () => {
    const updatedParticipants = participants.map((participant) => ({
      ...participant,
      attendance:
        attendance[participant.userId] ?? participant.attendance,
    }));

    const payload = {
      meetId,
      participants: updatedParticipants.map((participant) => ({
        userId: participant.userId,
        role: participant.role,
        attendance: participant.attendance,
      })),
    };

    console.log('=== Saving Attendance ===');
    console.log('Payload:', payload);

    try {
      setIsSaving(true);

      const response = await meetingApi.syncParticipants(payload);

      console.log('=== syncParticipants response ===');
      console.log(response);

      setParticipants(updatedParticipants);
      console.log('Attendance saved successfully');
      onClose?.();
    } catch (error) {
      console.error('Failed to save attendance:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="lk-attendance-overlay">
      <div
        {...props}
        className={`lk-attendance-panel ${props.className ?? ''}`}
      >
        <div className="lk-attendance-header">
          <span className="lk-attendance-title">Attendance</span>

          {layoutContext && (
            <button
              type="button"
              className="lk-attendance-close"
              onClick={onClose}
              aria-label="Close attendance"
            >
              <IconClose className="w-8 h-8" />
            </button>
          )}
        </div>

        <div className="lk-attendance-body">
          <div className="lk-attendance-list">
            {isLoading ? (
              <div className="lk-attendance-empty">
                Loading participants...
              </div>
            ) : participants.length === 0 ? (
              <div className="lk-attendance-empty">
                No participants found.
              </div>
            ) : (
              participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="lk-attendance-entry"
                >
                  <div className="lk-attendance-participant">
                    <span className="lk-attendance-name">
                      {participant.name}
                    </span>
                    <span className="lk-attendance-role">
                      {participant.role}
                    </span>
                  </div>

                  <InputDropdown
                    choices={attendanceOptions}
                    value={
                      attendance[participant.userId] ??
                      participant.attendance
                    }
                    onChange={(event) =>
                      handleAttendanceChange(
                        participant.userId,
                        event.target.value as AttendanceStatus,
                      )
                    }
                    className="text-xs bg-background-3"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lk-attendance-footer">
          <button
            type="button"
            className="btn-lime-outline-solid w-[200px] mx-auto"
            onClick={handleSave}
            disabled={
              isLoading ||
              isSaving ||
              participants.length === 0
            }
          >
            {isSaving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
}