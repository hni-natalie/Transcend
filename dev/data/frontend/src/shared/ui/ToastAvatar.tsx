import { useSocket } from "@/context";
import { DefaultAvatar } from "./DefaultAvatar"
import { ButtonVoiceMsg } from "@/features/livekit"
import { LivekitMode } from "@/shared/types/livekit.types"
import { ROUTE_PATH as R } from '@config/routes.manifest';

export const ToastAvatar = ({
	name,
	photo,
	mode,
	directKey,
	roomName,
	joinText = 'Accept',
	leaveText = 'Decline',
	onAccept,
	onDecline,
} : {
	name: string;
	photo?: string;
	joinText?: string;
	leaveText?: string;
	mode: LivekitMode;
	directKey: string;
	roomName: string;
	onAccept: () => void;
	onDecline: () => void;
}) => {

	const { setCallStatus, callStatus } = useSocket();
	
	return (
		<div
			className={`rounded-xl flex items-center shadow-xl min-w-[300px] max-w-[500px] animate-in fade-in slide-in-from-right-2 duration-200 bg-background-1 border border-background-3`}
		>
			<div className='flex w-full gap-2 p-4 border-r border-background-3 items-center'>
				{ photo ? (
					<img src={photo} alt={name} className="avatar-img rounded-full object-cover w-14 h-14"/>
				) : (
					<DefaultAvatar name={name} className="avatar-img rounded-full w-14 h-14"/>
				)}

				<div className='flex flex-col w-full'>
					<p className='text-base font-bold'>{name}</p>
					<p className='animate-pulse'>Connecting {mode === 'video' ? 'video ' : ''}call</p>
				</div>
			</div>

			<nav className='flex flex-col flex-1 gap-4 px-6'>
				{mode === 'call' ? (
					<ButtonVoiceMsg
						mode='call'
						showMute={false}
						joinText={joinText}
						leaveText={leaveText}
						directKey={directKey}
						roomName={roomName}
						onCallStatusChange={(status, dk) => setCallStatus({ status, directKey: dk ?? null })}
						className='text-accent-lime cursor-pointer hover:brightness-110 hover:saturation-150'
					/>
				) : (
					<ButtonVoiceMsg
						mode='video'
						showMute={false}
						joinText={joinText}
						leaveText={leaveText}
						directKey={directKey}
						roomName={roomName}
						onCallStatusChange={(status, dk) => setCallStatus({ status, directKey: dk ?? null })}
						className='text-accent-lime cursor-pointer hover:brightness-110 hover:saturation-150'
						meetingTitle={`Call with ${name}`}
						joinTo={R.USER_VIDEOCALL}
						leaveTo={R.USER_MESSAGES}
					/>
				)}
				{callStatus.status === 'idle' &&
					<button
						className='text-danger cursor-pointer hover:brightness-120'
						onClick={onDecline}
					>
						{leaveText}
					</button>
				}
			</nav>

		</div>
	)
}
