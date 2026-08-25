import { Modal, ModalHeader } from '@/shared';
import type { Recording } from '../meeting.types';
import { SummaryModal } from './SummaryModal';
import { useState } from "react";


type Props = {
    recordings?: Recording[];
    onClose: () => void;
};

export const RecordingModal = ({
    recordings = [],
    onClose,
}: Props) => {
    const [selectedSummary, setSelectedSummary] = useState<{
        summary: string | null;
        status: string;
    } | null>(null);
    
    return (
        <>
                <div className='form-layout'>
                    <ModalHeader 
                        title='Meeting Recordings'
                        onClose={onClose}
                    />
                    {/* Empty State */}
                    {recordings.length === 0 ? (
                        <p className="text-sm text-foreground-3 text-center py-6">
                            No recordings available.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-3 mt-6">
                            {recordings.map((recording) => (
                                <div key={recording.recordingId} className="task-list-layout">

                                    <div className="flex justify-between items-center mb-2">
                                    <div className="flex flex-col">
                                    <p className="font-medium">Recording</p>
                                    <p className="text-sm text-gray-400 mb-2">
                                        {new Date(recording.createdAt).toLocaleString("en-MY", {
                                            timeZone: "Asia/Kuala_Lumpur",
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })}
                                    </p>

                                    {recording.fileUrl ? (
                                        <div className="flex gap-3 text-xs">
                                            {recording.fileUrl && (
                                                <a
                                                    href={recording.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-accent-lime hover:underline"
                                                >
                                                    View Playback
                                                </a>
                                            )}

                                            <button
                                                onClick={() =>
                                                    setSelectedSummary({
                                                        summary: recording.summary ?? null,
                                                        status: recording.summaryStatus,
                                                    })
                                                }
                                                className="text-accent-lime hover:underline"
                                            >
                                                Summary
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-danger">
                                            Recording unavailable
                                        </p>
                                    )}
                                    </div>

                                    <span className={`text-sm font-medium capitalize ${
                                        recording.status === "completed"
                                            ? "text-white"
                                            : recording.status === "failed"
                                            ? "text-danger"
                                            : "text-warning"
                                    }`}>
                                        {recording.status}
                                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            <Modal 
                isOpen={!!selectedSummary}
                onClose={() => setSelectedSummary(null)}
            >
                {selectedSummary &&
                <SummaryModal
                    summary={selectedSummary.summary}
                    summaryStatus={selectedSummary.status as "pending" | "completed" | "failed"}
                    onClose={() => setSelectedSummary(null)}
                />
                }
            </Modal>
        </>
    );
};