import { useState, useEffect } from "react";
import { isAudioSupported, ButtonVoiceRoom } from '@features/livekit';
import { useSocket } from '@/context/SocketContext';

export function OfficeRoom() {
  // const { enableSocket } = useSocket();
  // useEffect(() => { enableSocket(); }, []);

  const [error, setError] = useState<string>('');

  // Check browser audio support
  useEffect(() => {
    const supported = isAudioSupported();
    if (!supported) {
      setError('Audio features are not supported in this browser');
    }
  }, []);

  return (
    <div>
      <p>Welcome to voice chat</p>
      <ButtonVoiceRoom />
      {/* <ButtonVoiceRoom roomName="playroom"/> */}
      {error && (<div className='text-danger'>{error}</div>)}

    </div>
  )
}
