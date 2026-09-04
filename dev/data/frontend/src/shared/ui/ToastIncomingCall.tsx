import { useSocket } from "@/context/SocketContext"
import { ToastAvatar } from "./ToastAvatar"
import { LivekitMode } from "@/shared/types/livekit.types"

export const ToastIncomingCall = () => {
	const { incomingCalls, dismissIncomingCall, declineCall, callStatus } = useSocket();
	const calls = Object.entries(incomingCalls);

	if (calls.length === 0 || callStatus.status === 'ringing' || callStatus.status === 'connected' ) return null;

	return (
		<div className="fixed top-6 right-8 z-9999 flex flex-col gap-2 items-end">
			{calls.map(([directKey, call]) => (
				<ToastAvatar
					key={directKey}
					name={call.callerName}
					photo={call.callerPhoto}
					mode={call.mode as LivekitMode}
					directKey={directKey}
					roomName={call.roomName}
					onAccept={() => dismissIncomingCall(directKey)}
					onDecline={() => declineCall(directKey, call.roomName, call.mode)}
				/>
			))}
		</div>
	)
}
