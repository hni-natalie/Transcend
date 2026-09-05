import { useEffect, useMemo, useState, useCallback } from "react";
import { InputTextArea, IconMeetingAdd, InputDropdownChip, InputText, ModalHeader } from "@shared";
import { useToast } from '@/context/ToastContext';
import { meetingApi } from "@features/meetings";
import type { MeetingDetails, Participant } from "@features/meetings/meeting.types";
import { DropdownChoice } from "@/shared/types/ui.types";

type User = {
    userId: string;
    userName: string;
    userEmail: string;
	deletedAt?: string | null;
};

type Props = {
    open: boolean;
    mode: "create" | "edit";

    meeting?: MeetingDetails;

    onClose: () => void;
    onCreated?: () => void;
    onUpdated?: () => void;
};

const roleOptions : DropdownChoice[] = [
    { id: 'organiser', name: 'Organiser' },
    { id: 'participant', name: 'Participant' },
];
const attendanceOptions : DropdownChoice[] = [
    { id: 'pending', name: 'Pending' },
    { id: 'present', name: 'Present' },
    { id: 'absent', name: 'Absent' },
];

const MEETING_TITLE_MAX_LENGTH = 100;
const MEETING_DESC_MAX_LENGTH = 500;
const MIN_DURATION_MS = 5 * 60 * 1000;  // 5 minutes
const MAX_DURATION_MS = 20 * 60 * 1000; // 20 minutes

const validateMeetingForm = (data: {
    title: string;
    description?: string;
    start: string;
    end: string;
}): string | null => {
    const trimmedTitle = data.title.trim();
    if (!trimmedTitle) {
        return "Meeting title is required.";
    }
    if (trimmedTitle.length > MEETING_TITLE_MAX_LENGTH) {
        return `Meeting title must be under ${MEETING_TITLE_MAX_LENGTH} characters.`;
    }
    if (data.description && data.description.trim().length > MEETING_DESC_MAX_LENGTH) {
        return `Meeting description must be under ${MEETING_DESC_MAX_LENGTH} characters.`;
    }
    if (!data.start || !data.end) {
        return "Please select both start and end time.";
    }

    const startDate = new Date(data.start);
    const endDate = new Date(data.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return "Please enter valid meeting dates.";
    }

    if (startDate < new Date()) {
        return "Meeting start time cannot be in the past.";
    }

    if (startDate >= endDate) {
        return "Meeting start time must be before end time.";
    }

    const duration = endDate.getTime() - startDate.getTime();
    if (duration < MIN_DURATION_MS) {
        return "Meeting duration too short and must be at least 5 minutes.";
    }
    if (duration > MAX_DURATION_MS) {
        return "Meeting duration cannot exceed 20 minutes.";
    }

    return null;
};

export const ScheduleMeetingModal = ({
    open,
    onClose,
    onCreated,
    onUpdated,
    mode,
    meeting,
}: Props) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");

    const [users, setUsers] = useState<Participant[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
	const { showToast } = useToast();
    

    const resetForm = useCallback(() => {
        setTitle("");
        setDescription("");
        setStart("");
        setEnd("");
        setSelectedUserIds([]);
        setErrorMessage("");
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [resetForm, onClose]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            handleClose();
        }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
        window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, handleClose]);

    useEffect(() => {
        if (!open) return;

        const loadUsers = async () => {
        try {
            const res = (await meetingApi.allUsers())as User[];
            // extend all users with role & attendance
            setUsers(prev => {
              const prevById = new Map(prev.map(u => [u.userId, u]));

              const merged = res.map(u =>
                prevById.get(u.userId) ?? {
                  ...u,
                  role: "participant" as const,
                  attendance: "pending" as const,
                }
              );
              // add if users non existent in list (?)
              const extra = prev.filter(
                u => !res.some(r => r.userId === u.userId)
              );
              return [...merged, ...extra];
            });
        } catch (err) {
            console.error(err);
        }
        };

        loadUsers();
    }, [open]);

    const toDateTimeLocal = (date: string) => {
        const d = new Date(date);

        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());

        return d.toISOString().slice(0, 16);
    };
    
    const toggleUser = (userId: string) => {
        setSelectedUserIds((prevSelected) => {
        if (prevSelected.includes(userId)) 
            return prevSelected.filter((id) => id !== userId);
        else 
            return [...prevSelected, userId];
        });
    }

    useEffect(() => {
        if (!open) return;

        if (mode === "edit" && meeting) {
            setTitle(meeting.meetTitle);
            setDescription(meeting.meetDesc ?? "");

            setStart(toDateTimeLocal(meeting.meetStart));
            setEnd(toDateTimeLocal(meeting.meetEnd));

            // update with Users existing role status
            setUsers(prev => {
                const byId = new Map(prev.map(u => [u.userId, u]));

                meeting.participants.forEach(p => {
                    byId.set(p.userId, {
                        userId: p.userId,
                        userName: p.user.userName,
                        userEmail: p.user.userEmail,
                        role: p.role,
                        attendance: p.attendance,
						deletedAt: p.user.deletedAt,
                    });
                });
                return Array.from(byId.values());
            });
            setSelectedUserIds(meeting.participants.map(p => p.userId));
        } else {
            resetForm();
        }
    }, [open, mode, meeting, resetForm]);

    const selectedUsers = useMemo(() => {
        return users.filter(user => selectedUserIds.includes(user.userId));
    }, [users, selectedUserIds]);

    const updateRole = (
        userId: string,
        role: "organiser" | "participant"
    ) => {
        setUsers(prev =>
            prev.map(user =>
                user.userId === userId
                    ? { ...user, role }
                    : user
            )
        );
    };

    const updateAttendance = (
        userId: string,
        attendance: "present" | "absent" | "pending"
    ) => {
        setUsers(prev =>
            prev.map(user =>
                user.userId === userId
                    ? { ...user, attendance }
                    : user
            )
        );
    };

    const isFormValid = title.trim() !== "" && start !== "" && end !== "";

    // Format a Date object to the local datetime-local string (YYYY-MM-DDTHH:mm)
    const toLocalDateTimeString = (date: Date): string => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const getNowMin = () => toLocalDateTimeString(new Date());

    const getMinEndTime = () => {
        if (!start) return "";
        const startDate = new Date(start);
        // minimum 5 minutes duration
        startDate.setMinutes(startDate.getMinutes() + 5);
        return toLocalDateTimeString(startDate);
    };

    const getMaxEndTime = () => {
        if (!start) return "";
        const startDate = new Date(start);
        // maximum 20 minutes duration (known limitation)
        startDate.setMinutes(startDate.getMinutes() + 20);
        return toLocalDateTimeString(startDate);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

		const validationError = validateMeetingForm({
            title,
            description,
            start,
            end,
        });

		if (validationError) {
            setErrorMessage(validationError);
            return;
		}


        // if (!title.trim()) {
        //     setErrorMessage("Meeting title is required.");
        // return;
        // }

        // if (!start || !end) {
        //     setErrorMessage("Please select both start and end time.");
        // return;
        // }

        // if (new Date(start) >= new Date(end)) {
        //     setErrorMessage("Meeting start time must be before end time.");
        //     return;
        // } else if (
        //     new Date(end).getTime() -
        //     new Date(start).getTime()
        //     < 5 * 60 * 1000
        // ) {
        //     setErrorMessage(
        //         "Meeting duration too short and must be at least 5 minutes."
        //     );
        //     return;
        // } 

        try {
            setLoading(true);
			setErrorMessage("");

            if (mode === "create") {
                const res = await meetingApi.createMeeting({
                    spaceId: "97e0e69d-7f35-4b67-9a40-c5641f0eb677",
                    meetTitle: title,
                    meetDesc: description,
                    meetStart: new Date(start).toISOString(),
                    meetEnd: new Date(end).toISOString()
                });

                await meetingApi.syncParticipants({
                    meetId: res.data.meetId,
                    participants: selectedUsers.map(user => ({
                        userId: user.userId,
                        role: user.role,
                        attendance: user.attendance,
                    }))
                });

				showToast('success', 'Meeting scheduled successfully!');
                onCreated?.();

            } else if (mode === "edit" && meeting) {

                await meetingApi.syncParticipants({
                    meetId: meeting.meetId,
                    participants: selectedUsers.map(user => ({
                        userId: user.userId,
                        role: user.role,
                        attendance: user.attendance,
                    })),
                    meetStart: new Date(start).toISOString(),
                    meetEnd: new Date(end).toISOString()
                });

                await meetingApi.updateMeeting({
                    meetId: meeting.meetId,
                    meetTitle: title,
                    meetDesc: description,
                    meetStart: new Date(start).toISOString(),
                    meetEnd: new Date(end).toISOString(),
                });    
            
				showToast('success', 'Meeting updated successfully!');
                onUpdated?.();
            }

            handleClose();

        } catch (err: any) {
            console.error(err);

            const message = err.message;

            if (message?.startsWith("Meeting conflict detected for:")) {
                setErrorMessage(message);
            } else {
                const fallback = "Failed to schedule meeting. Please try again.";
                setErrorMessage(fallback);
                showToast('error', fallback);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className='form-layout'
        >
            <ModalHeader 
                icon={IconMeetingAdd}
                iconClassName='w-7 h-7 text-white'
                title={mode === "edit" ? "Update Meeting" : "Schedule Meeting"}
                onClose={handleClose}
            />

            {errorMessage && (
                <div className="rounded-lg border border-danger bg-red-500/10 px-4 py-2 text-sm text-danger">
                    {errorMessage}
                </div>
            )}

            <InputText
                title='Title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter meeting title"
                className="bg-background"
                required={true}
                type='text'
            />
            <InputTextArea
                title='Description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Meeting Description"
                className="bg-background"
            />
            <InputText
                title='Start Time'
                value={start}
                min={getNowMin()}
                onChange={(e) => {
                    const newStart = e.target.value;
                    setStart(newStart);
                    // Reset end if it's no longer valid relative to the new start
                    if (end && new Date(end).getTime() <= new Date(newStart).getTime()) {
                        setEnd("");
                    }
                }}
                required={true}
                type='datetime-local'
                className="bg-background"
            />
            <InputText
                title='End Time'
                value={end}
                min={start || getNowMin()}
                onChange={(e) => setEnd(e.target.value)}
                required={true}
                type='datetime-local'
                className="bg-background"
            />
            <InputDropdownChip
                title='Invite Participants'
                placeholder='Select Members'
                emptyText='No users found'
                users={users}
                selectedUserIds={selectedUserIds}
                onUserToggle={toggleUser}
                onRoleUpdate={updateRole}
                onAttendanceUpdate={updateAttendance}
                className="bg-background"
            />

            <nav className="flex justify-center gap-3 pt-4">
            <button
                type="submit"
                disabled={loading || !isFormValid}
                className="btn-lime-outline-solid w-[200px] mx-auto"
            >
                {loading
                    ? mode === "edit"
                        ? "Updating..."
                        : "Creating..."
                    : mode === "edit"
                        ? "Update Meeting"
                        : "Create Meeting"
                }
            </button>
            </nav>
        </form>
    );
}