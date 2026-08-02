import type { MeetingChatMessage } from '../meeting.types';


type Props = {
    messages?: MeetingChatMessage[];
    onClose: () => void;
};

export const MeetingChatModal = ({
    messages = [],
    onClose,
}: Props) => {
    console.log("Modal messages:", messages);
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col gap-y-4 w-full max-w-[480px] max-h-[88vh] overflow-y-auto rounded-[1.5rem] bg-[#1b1b1b] border border-[#242424] px-8 py-7 shadow-2xl text-gray-200">

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">
                        Meeting Chat
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary"
                    >
                        ✕
                    </button>
                </div>


                {messages.length === 0 ? (
                    <p className="text-sm text-text-secondary text-center py-6">
                        No chat messages available.
                    </p>
                ) : (
                    <div className="flex flex-col gap-3">

                        {messages.map((msg)=>(
                            <div
                                key={msg.id}
                                className="border border-surface-secondary rounded-lg p-3"
                            >

                                <div className="flex justify-between">
                                    <p className="text-sm font-medium">
                                        {msg.senderName}
                                    </p>

                                    <p className="text-xs text-text-secondary">
                                        {new Date(
                                            msg.createdAt
                                        ).toLocaleTimeString()}
                                    </p>
                                </div>


                                <p className="text-sm mt-1">
                                    {msg.message}
                                </p>

                            </div>
                        ))}

                    </div>
                )}

            </div>
        </div>
    );
};