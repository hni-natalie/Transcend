import { useEffect, useMemo, useState, useCallback } from "react";
import { IconMeetings } from "@shared";
import { meetingApi } from "@features/meetings";

type User = {
    userId: string;
    userName: string;
    userEmail: string;
};

type Props = {
    open: boolean;
    onClose: () => void;

    // optional callback to refresh meetings
    onCreated?: () => void;
};

export const ScheduleMeetingModal = ({
    open,
    onClose,
    onCreated,
}: Props) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");

    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const resetForm = useCallback(() => {
        setTitle("");
        setDescription("");
        setStart("");
        setEnd("");
        setSearch("");
        setSelectedUsers([]);
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

            setUsers(res);
        } catch (err) {
            console.error(err);
        }
        };

        loadUsers();
    }, [open]);

    const filteredUsers = useMemo(() => {
        return users.filter((user) =>
        user.userName.toLowerCase().includes(search.toLowerCase())
        );
    }, [users, search]);

    const toggleParticipant = (userId: string) => {
        setSelectedUsers((prev) =>
        prev.includes(userId)
            ? prev.filter((id) => id !== userId)
            : [...prev, userId]
        );
    };

    const isFormValid = title.trim() !== "" && start !== "" && end !== "";

    const getMinEndTime = () => {
        if (!start) return "";

        const startDate = new Date(start);

        // minimum 5 minutes duration
        startDate.setMinutes(startDate.getMinutes() + 5);

        return startDate.toISOString().slice(0, 16);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            setErrorMessage("Meeting title is required.");
        return;
        }

        if (!start || !end) {
            setErrorMessage("Please select both start and end time.");
        return;
        }

        if (new Date(start) >= new Date(end)) {
            setErrorMessage("Meeting start time must be before end time.");
            return;
        } else if (
            new Date(end).getTime() -
            new Date(start).getTime()
            < 5 * 60 * 1000
        ) {
            setErrorMessage(
                "Meeting duration too short and must be at least 5 minutes."
            );
            return;
        } 

        try {
            setLoading(true);

            await meetingApi.createMeeting({
                spaceId: "97e0e69d-7f35-4b67-9a40-c5641f0eb677",
                meetTitle: title,
                meetDesc: description,
                meetStart: new Date(start).toISOString(),
                meetEnd: new Date(end).toISOString(),
                participants: selectedUsers,
            });

            alert("Meeting scheduled successfully!");

            handleClose();
            onCreated?.();

        } catch (err: any) {
            console.error(err);

            const message = err.message;

            if (message?.startsWith("Meeting conflict detected for:")) {
                setErrorMessage(message);
            } else {
                setErrorMessage("Failed to schedule meeting. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
        >
        <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col gap-y-4 w-full max-w-[480px] max-h-[88vh] overflow-y-auto rounded-[1.5rem] bg-[#1b1b1b] border border-[#242424] px-8 py-7 shadow-2xl text-gray-200"
        >
            <button
            onClick={handleClose}
            className="close-right"
            >
            ✕
            </button>

            <div className="flex flex-col items-center justify-center gap-y-2 text-center">
            <IconMeetings className="w-8 h-8 text-white" />

            <h1 className="text-3xl font-medium text-accent-lime">
                Schedule Meeting
            </h1>
            </div>

            {errorMessage && (
                <div className="rounded-lg border border-red-500 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                    {errorMessage}
                </div>
            )}

            <div>
            <label className="block mb-2 text-sm font-medium">
                Meeting Title
            </label>

            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter meeting title"
                className="w-full rounded-lg border border-[#333] bg-[#262626] px-4 py-2 outline-none focus:border-accent-lime"
            />
            </div>

            <div>
            <label className="block mb-2 text-sm font-medium">
                Description
            </label>

            <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Meeting description"
                className="w-full rounded-lg border border-[#333] bg-[#262626] px-4 py-2 resize-none outline-none focus:border-accent-lime"
            />
            </div>

            <div>
                <label className="block mb-2 text-sm font-medium">
                    Start Time
                </label>

                <input
                    type="datetime-local"
                    value={start}
                    min={new Date().toISOString().slice(0,16)}
                    onChange={(e) => {
                        setStart(e.target.value);

                        if (end && e.target.value >= end) {
                            setEnd("");
                        }
                    }}
                    className="w-full rounded-lg border border-[#333] bg-[#262626] px-4 py-2 outline-none focus:border-accent-lime"
                />
            </div>

            <div>
                <label className="block mb-2 text-sm font-medium">
                    End Time
                </label>

                <input
                    type="datetime-local"
                    value={end}
                    min={getMinEndTime()}
                    onChange={(e) => setEnd(e.target.value)}
                    className="w-full rounded-lg border border-[#333] bg-[#262626] px-4 py-2 outline-none focus:border-accent-lime"
                />
            </div>

            <div>
            <label className="block mb-2 text-sm font-medium">
                Invite Participants
            </label>

            <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[#333] bg-[#262626] px-4 py-2 outline-none focus:border-accent-lime mb-3"
            />

            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                {users
                    .filter((u) => selectedUsers.includes(u.userId))
                    .map((u) => (
                    <div
                        key={u.userId}
                        className="flex items-center gap-2 rounded-full bg-accent-lime text-black px-3 py-1 text-xs font-medium"
                    >
                        {u.userName}

                        <button
                        onClick={() => toggleParticipant(u.userId)}
                        >
                        ✕
                        </button>
                    </div>
                    ))}
                </div>
            )}

            <div className="max-h-52 overflow-y-auto rounded-lg border border-[#333] bg-[#262626]">
                {filteredUsers.map((user) => (
                <label
                    key={user.userId}
                    className="flex justify-between items-center px-4 py-3 border-b border-[#333] cursor-pointer hover:bg-[#303030]"
                >
                    <div>
                    <p className="text-sm font-medium">
                        {user.userName}
                    </p>

                    <p className="text-xs text-gray-400">
                        {user.userEmail}
                    </p>
                    </div>

                    <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.userId)}
                    onChange={() =>
                        toggleParticipant(user.userId)
                    }
                    />
                </label>
                ))}

                {filteredUsers.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">
                    No users found.
                </div>
                )}
            </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
            <button
                onClick={handleClose}
                className="rounded-lg border border-gray-600 px-5 py-2 text-sm hover:bg-gray-700 transition"
            >
                Cancel
            </button>

            <button
                type="submit"
                disabled={loading || !isFormValid}
                onClick={handleSubmit}
                className="rounded-lg bg-accent-lime px-5 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
            >
                {loading ? "Creating..." : "Create Meeting"}
            </button>
            </div>
        </form>
        </div>
    );
}