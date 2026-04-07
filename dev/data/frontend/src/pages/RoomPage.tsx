import { useState } from "react";
import { useLiveKit } from '../hooks/useLiveKit'

export default function RoomPage() {
  const { connect, disconnect, isConnected } = useLiveKit('myroom', 'user123');
  const [joinCount, setJoinCount] = useState(0);

  const handleJoin = async () => {
    const result = await connect();
    if (result.success) {
      console.log('Connected - token reused if valid');
      setJoinCount(prev => prev + 1);
    }
  };

  const handleLeave = () => {
    disconnect();
  };

  return (
    <div>
      <p>Times joined this session: {joinCount}</p>
      {!isConnected ? (
        <button onClick={handleJoin} className="cursor-pointer">Join Room</button>
      ) : (
        <button onClick={handleLeave} className="cursor-pointer">Leave Room</button>
      )}
    </div>
  )
}

// import { MenuSide, FormAddUser, FormAddWorkspace } from '../components';
// import { menuConfig } from '../config/menu.conf';

// export default function RoomPage () {
//   return (
//     <div className='bg-brand-black-sub h-screen'>

//       <div className='flex h-full gap-x-0.5'>
//         <MenuSide conf={menuConfig} />

//         <div className='bg-brand-black flex w-full p-8 gap-8'>
//           <FormAddUser />
//           <FormAddWorkspace />

//           {/* <div className='p-8 bg-gray-800 w-full'>
//             <h1>example container</h1>
//           </div> */}

//         </div>

//       </div>

//     </div>
//   )
// }