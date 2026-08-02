import type { Recording } from '../meeting.types';

type Props = {
    recordings?: Recording[];
    onClose: () => void;
};

export const RecordingModal = ({
    recordings = [],
    onClose,
}: Props) => {

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col gap-y-4 w-full max-w-[480px] max-h-[88vh] overflow-y-auto rounded-[1.5rem] bg-[#1b1b1b] border border-[#242424] px-8 py-7 shadow-2xl text-gray-200">

                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">
                        Meeting Recordings
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary"
                    >
                        ✕
                    </button>
                </div>

                {/* Empty State */}
                {recordings.length === 0 ? (
                    <p className="text-sm text-text-secondary text-center py-6">
                        No recordings available.
                    </p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {recordings.map((recording) => (
                            <div key={recording.recordingId} className="border border-surface-secondary rounded-lg p-3">

                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-medium">Recording</p>

                                    <span className={`text-xs ${
                                        recording.status === "completed"
                                            ? "text-green-400"
                                            : recording.status === "failed"
                                            ? "text-red-400"
                                            : "text-yellow-400"
                                    }`}>
                                        {recording.status}
                                    </span>
                                </div>

                                <p className="text-xs text-text-secondary mb-2">
                                    {new Date(recording.createdAt).toLocaleString("en-MY", {
                                        timeZone: "Asia/Kuala_Lumpur",
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </p>

                                {recording.fileUrl ? (
                                    <a
                                        href={recording.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-accent-lime text-sm hover:underline"
                                    >
                                        Open Recording
                                    </a>
                                ) : (
                                    <p className="text-sm text-red-400">
                                        Recording unavailable
                                    </p>
                                )}

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};