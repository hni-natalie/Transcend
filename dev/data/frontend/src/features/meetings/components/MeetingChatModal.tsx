import { ModalHeader } from '@/shared';
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
            <div className='form-layout'>

                <ModalHeader 
                    title='Meeting Chat'
                    onClose={onClose}
                />
                {messages.length === 0 ? (
                    <p className="text-sm text-foreground-3 text-center py-6">
                        No chat messages available.
                    </p>
                ) : (
                    <div className="flex flex-col gap-3 mt-6">

                        {messages.map((msg)=>(
                            <div
                                key={msg.id}
                                className='task-list-layout rounded-xl'
                            >

                                <div className="flex justify-between text-xs text-foreground-3">
                                    <p className="font-medium">
                                        {msg.senderName}
                                    </p>

                                    <p>
                                        {new Date(msg.createdAt).toLocaleString("en-MY", {
                                            timeZone: "Asia/Kuala_Lumpur",
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
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
    );
};