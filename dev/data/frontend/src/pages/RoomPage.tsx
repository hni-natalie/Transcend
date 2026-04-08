import { useState, useEffect } from "react";
import { isAudioSupported } from '../utils/useAudio';
import { ButtonVoiceRoom } from '../components';

export default function RoomPage() {
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
      {error && (<div className='text-danger-base'>{error}</div>)}

    </div>
  )
}