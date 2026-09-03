import { DefaultAvatar } from "./DefaultAvatar"
import { ButtonVoiceMsg } from "@/features/livekit"
import { LivekitMode } from "@/shared/types/livekit.types"
import { ROUTE_PATH as R } from '@config/routes.manifest';

export const ToastAvatar = ({
	name,
	mode,
	joinText = 'Accept',
	leaveText = 'Decline'
} : {
	name: string;
	joinText?: string;
	leaveText?: string;
	mode: LivekitMode;
}) => {

	return (
		<div className="fixed top-6 right-8 z-9999 flex flex-col gap-2 items-end">
			<div
				// key={toast.id}
				className={`rounded-xl flex items-center shadow-xl min-w-[300px] max-w-[500px] animate-in fade-in slide-in-from-right-2 duration-200 bg-background-1 border border-background-3`}
			>
				<div className='flex w-full gap-2 p-4 border-r border-background-3 items-center'>
					{/* {icons[toast.type]} */}
					<DefaultAvatar name={name} className="avatar-img rounded-full w-14 h-14"/>

					<div className='flex flex-col w-full'>
						<p className='text-base font-bold'>{name}</p>
						<p>Incoming call</p>
					</div>
				</div>

				<nav className='flex flex-col flex-1 gap-4 px-6'>
					{mode === 'call' ? (
						<ButtonVoiceMsg
							mode='call'
							joinText={joinText}
							className='text-accent-lime cursor-pointer hover:brightness-110 hover:saturation-150'
						/>
					) : (
						<ButtonVoiceMsg
							mode='video'
							joinText={joinText}
							className='text-accent-lime cursor-pointer hover:brightness-110 hover:saturation-150'
							// roomName={`${directKey ?? 'room'}:video`}
							// directKey={directKey ?? undefined}
							meetingTitle={`Call with ${name}`}
							joinTo={R.USER_VIDEOCALL}
							leaveTo={R.USER_MESSAGES}
						/>
					)}
					<button 
						className='text-danger cursor-pointer hover:brightness-120'
						// onClose={}
					>
						{leaveText}
					</button>
				</nav>

			</div>
		</div>
	)
}