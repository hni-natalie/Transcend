// const { apiClient }         = require('../api/api.client.js')
const { apiClient } 				=	require("../api/api.client.js");
const { randomHslColor }    = require('../utils/color.js');
const { v4:uuidv4 }         = require('uuid')


/* ***************************************************************** */

/**
 * Creates a player object with default values
 * @param {Object} player - Player player
 * @param {string} player.id - Player ID
 * @param {string} player.userId - User ID
 * @param {string} player.name - Display name
 * @param {string} player.dpId - Department ID
 * @param {string|null} player.roomName - Room name
 * @param {Object} player.position - Position in 3D space
 * @param {Object} player.rotation - Rotation in radians
 * @param {string} player.color - HSL color
 * @param {string} player.photo - Avatar URL
 * @param {boolean} player.audioEnabled - Audio status
 * @param {boolean} player.speaking - Speaking status
 * @returns {Object} Player object
 */

const createPlayer = ({
  id,
  userId,
  name,
  dpId = 'guest',
  roomName = null,
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: -Math.PI / 2, y: 0, z: 0 },
  color = randomHslColor(),
  photo = '',
  audioEnabled = true,
  speaking = false,
} = {}) => {
  return {
    id,
    userId,
    name,
    dpId,
    roomName,
    position,
    rotation,
    color,
    photo,
    audioEnabled,
    speaking,
  };
}

const randomPosition = ( range=10 ) => {
    return {
        x: (Math.random() - 0.5) * range * 2, // -range to +range
        y: 0, // Keep y at 0 for ground level
        z: (Math.random() - 0.5) * range * 2  // -range to +range
    };
}

const fetchRoomObjs = async() => {
  // implement from db or admin config
  // placeholder atm
  const mockObjects = [];
  const count = 2; // Number of mock objects
  
  for (let i = 0; i < count; i++) {
    const objectId = uuidv4();
    // console.log('random pos: ', randomPosition(2));

    mockObjects.push(
      createPlayer({
        id: i,
        userId: objectId,
        name: `Obj-${objectId}`,
        dpId: 'guest',
        roomName: 'Office',
        position: randomPosition(5),
        rotation: { x:-Math.PI/2, y:0, z:0 },
        color: randomHslColor(),
        photo: '',
        audioEnabled: true,
        speaking: false,
      }));
  }
  return mockObjects; // Return array
}

// ### fetch roomObjects here, from db i guess
// admin setting -> db, then fetch db -> room
const initializeRoomData = async (rooms, roomName) => {
  const roomData = {
    name: roomName,
    users: [],
    objects: [],
    createdAt: Date.now()
  };

  // fetch all db users with online status in Office
	// bug: when user is online(has socket) but not joined room
	// when join room will need to rewrite
  if (roomName === 'Office'){

    const activeUsers = await apiClient.get('/users/status/online');
    const existingObjs = await fetchRoomObjs();

    const count = activeUsers.length;
    console.log('num of active users: ', count);
		const trimUser = activeUsers.slice(0, 3);
    // console.log('[socket-service] active users: ', trimUser);
    console.log('[socket-service] active objs: ', existingObjs);

    trimUser.forEach(user => {
    // activeUsers.forEach(user => {
      const existingPlayer = createPlayer({
        id: user.userId, // socket.id
        userId: user.userId,
        name: user.userName || null,
		    dpId: user?.department?.dpId || 'guest',
        roomName: 'Office',
        position: randomPosition(2),
        rotation: { x:-Math.PI/2, y:0, z:0 },
        color: randomHslColor(),
        photo: user.avatarUrl || null,
        audioEnabled: false,
        speaking: false,
      });
      roomData.users.push(existingPlayer);
    });
    roomData.objects.push(...existingObjs);
  }
  rooms.set(roomName, roomData);
  return roomData
}

module.exports = { initializeRoomData, createPlayer, randomPosition };