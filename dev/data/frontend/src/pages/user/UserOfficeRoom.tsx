import { useState, useEffect } from "react";
import { isAudioSupported } from '../../features/livekit/services/audioManager';
import { ButtonVoiceRoom } from '@features/livekit';
import { useSocket } from '../../../context/ContextSocket';

export function UserOfficeRoom() {
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
      {error && (<div className='text-danger-base'>{error}</div>)}

    </div>
  )
}
