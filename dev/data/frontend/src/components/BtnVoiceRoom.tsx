/*
 handles voice room joining request, leave room request & mute/unmute
*/

import { useState, useEffect } from "react";
import useLiveKit from '../utils/useLivekit'
// import { useSocket } from '../context/ContextSocket';
import { IconMute, IconSpeak } from '../config/menu.icons.conf';
import Loading from "./BtnLoading";

export default function ButtonVoiceRoom( { roomName='myroom', allowLeave=true } ) {
  const { connect, disconnect, isConnected, isMuted, toggleMute } = useLiveKit(roomName);
  const [joinCount, setJoinCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  
  useEffect(() => {
    console.log('FE lk Connection status: ', isConnected);
  }, [isConnected]);

  const handleJoin = async () => {
    setLoading(true)
    // const result = await connect();
    // if (result.success) {
    //   console.log('Successfully joined room');
    //   setJoinCount(prev => prev + 1);
    // } else 
    //   console.error('Connection failed:', result.error);
    // setLoading(false)

    const onSuccess = (event: any) => {
      console.log('Connection complete!', event.detail);
      setJoinCount(prev => prev + 1);
      setLoading(false);
      window.removeEventListener('livekit-connect-success', onSuccess);
    };
    
    const onError = (event: any) => {
      console.error('Connection failed!', event.detail);
      setLoading(false);
      window.removeEventListener('livekit-connect-error', onError);
    };
    
    window.addEventListener('livekit-connect-success', onSuccess);
    window.addEventListener('livekit-connect-error', onError);

    connect();
  };

  const handleLeave = () => {
    disconnect();
  };

  return (
    <nav className="flex justify-center">
      {!isConnected ? (
        <div>
          {/* <button onClick={handleJoin} className="bg-teal-600 cursor-pointer rounded-xl p-4"> */}
          <button onClick={handleJoin} className="btn-lime-outline">
            {loading 
            ? <Loading isLoading={loading}/>
            : `Join ${roomName} Voice Chat : ${joinCount}`}
          </button>
        </div>
      ) : (
        <div className="flex gap-4 items-center">
          {allowLeave && (<button onClick={handleLeave} className="btn-lime-outline">Leave Voice Chat</button>)}
          {/* button with mute/unmute icon */}
          <button onClick={toggleMute} className={`${isMuted ? 'btn-outline' : 'btn-lime-outline'} rounded-full transition-colors duration-500 p-1`}>{ isMuted ? <IconMute className="w-4 h-4 text-brand-gray-500"/> : <IconSpeak className="w-4 h-4"/> }</button>
        </div>
      )}
    </nav>
  )
}