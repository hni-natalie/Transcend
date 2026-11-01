import { useLiveKit } from "@/features/livekit";
import { useOfficeInteraction } from "@/features/office/context/OfficeInteractionContext";
import { ModalHeader } from "@/shared"

export const ModalShareAudio = ({
	roomName,
	onClose
}) => {
	const { touchedObject, setTouchedObject } = useOfficeInteraction();
	const { shareWindowAudio } = useLiveKit(roomName);

	const handleShareWindowAudio = async () => {
		try {
			const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
			if (isMobile)
				throw new Error('Window audio sharing is not supported on mobile devices.');
			else if (!!window.chrome?.runtime === false)
				throw new Error('Window audio sharing is only supported in Chromium-based browsers (Chrome, Edge, etc.).');
			await shareWindowAudio();
		} catch (e) {
			alert(e?.message || 'Unable to share window audio.');
		} finally {
			setTouchedObject(null);
		}
	};

	return (
		<div className='w-full max-w-md rounded-[1.5rem] border border-background-4 bg-background-1 p-6 pb-8 text-center text-white shadow-2xl'>
		<ModalHeader
				title='Share window audio?'
				titleClassName='text-lg font-semibold text-white!'
				iconClassName='w-6! h-6!'
					onClose={onClose}
		/>
			<p className='mt-4 text-sm text-foreground-3'>You touched {touchedObject?.id}. Select a source with audio enabled to share your music with others.</p>
		<nav className='mt-5 flex justify-center gap-3'>
			<button
				type='button'
				className='btn-header'
				onClick={handleShareWindowAudio}>Share audio</button>
		</nav>
	</div>
	)
}