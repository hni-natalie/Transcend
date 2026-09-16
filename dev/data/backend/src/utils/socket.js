const { apiClient } 		= require("../api/api.client.js");
const { randomHslColor }    = require('../utils/color.js');
const { v4:uuidv4 }         = require('uuid')
const d3                    = require('d3-hierarchy');
const OFFICE_LAYOUT_CONFIG  = require('../../../shared/office.config.json');

/**
 * Computes treemap-based spawn positions/sizes for office spaces
 * @param {Array} spaces - spaces from GET /spaces (spaceId, userCapacity, departmentId, accessLevel)
 * @returns {Array} positionData - [{ spaceId, spaceName, departmentId, accessLevel, x, z, width, height }]
 */
const generatePositionedPlanes = (spaces) => {
  const { width, height, padding, shrinkFactor } = OFFICE_LAYOUT_CONFIG;

  const root = d3.stratify()
    .id(d => d.id)
    .parentId(d => d.parentId || null)
    ([
      { id: 'root', value: 0 },
      ...spaces.map(s => ({ id: s.spaceId, parentId: 'root', value: s.userCapacity }))
    ])
    .sum(d => Math.sqrt(d.value ?? 0));
    // .sum(d => Math.log((d.value ?? 0) + 1)); // lesser diff between large & small

  const treemap = d3.treemap()
    .size([width, height])
    .padding(padding)
    .tile(d3.treemapSquarify.ratio(1));

  const layout = treemap(root);

  const data = layout.leaves().map((leaf) => {
    const space = spaces.find(s => s.spaceId === leaf.data.id);
    return {
      spaceId: space?.spaceId,
      spaceName: space?.spaceName,
      departmentId: space?.departmentId,
      accessLevel: space?.accessLevel,
      x: (leaf.x0 + leaf.x1) / 2 - width / 2,
      z: (leaf.y0 + leaf.y1) / 2 - height / 2,
      width: (leaf.x1 - leaf.x0) * shrinkFactor,
      height: (leaf.y1 - leaf.y0) * shrinkFactor,
    };
  });
  return data;
};

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
  color = randomHslColor("80"),
  photo = '',
  audioEnabled = true,
  speaking = false,
  ownership = { ownerId: null, timestamp: null },
  action = '',
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
    ownership,
    action,
  };
}

const createRoom = ({
  roomName,
  users = [],
  objects = [],
  particles = [],
  positionData = [],
  createdAt = Date.now()
}) => {
  return ({
    roomName,
    users,
    objects,
    particles,
    positionData,
    createdAt
  });
}

const createDustParticles = async( count=250 ) => {
  const particles = [];

  for (let i = 0; i < count; i++) {
    const objectId = uuidv4();
    particles.push(
      createPlayer({
        id: i,
        userId: objectId,
        name: `Obj-${objectId}`,
        dpId: 'guest',
        roomName: 'Office',
        position: randomPosition(50),
        rotation: { x:-Math.PI/2, y:0, z:0 },
        color: randomHslColor("90"),
        photo: '',
        audioEnabled: true,
        speaking: false,
        ownership: {
          ownerId: null,
          timestamp: null,
        },
  }));
  }
  return particles; // Return array
}

const randomPosition = ( range=10 ) => {
    return {
        x: (Math.random() - 0.5) * range * 2, // -range to +range
        y: 0, // Keep y at 0 for ground level
        z: (Math.random() - 0.5) * range * 2  // -range to +range
    };
}

const getRoomObjs = async() => {
  // future: implement from db or admin config
  const mockObjects = [];
  const count = 2;
  let i = 0;
  for (i; i < count; i++) {
    const objectId = uuidv4();

    mockObjects.push(
      createPlayer({
        id: i,
        userId: objectId,
        name: `Obj-${objectId}`,
        dpId: 'guest',
        roomName: 'Office',
        position: randomPosition(5),
        rotation: { x:-Math.PI/2, y:0, z:0 },
        color: randomHslColor("90"),
        photo: '',
        audioEnabled: true,
        speaking: false,
        ownership: {
          ownerId: null,
          timestamp: null,
        },
      }));
  }
  // create radio
  mockObjects.push(
  createPlayer({
    id: i,
    userId: uuidv4(),
    name: `Audio Streamer`,
    dpId: 'guest',
    roomName: 'Office',
    position: randomPosition(8),
    rotation: { x:-Math.PI/2, y:0, z:0 },
    color: randomHslColor("90"),
    photo: '',
    audioEnabled: true,
    speaking: false,
    ownership: {
      ownerId: null,
      timestamp: null,
    },
    action: 'share-window-audio'
  }));
  return mockObjects; // Return array
}

const getSpawnPosFromDpId = ( roomData, userDpId ) => {
  const offset = randomPosition(2);

  for (const [key, room] of Object.entries(roomData.positionData)) {
    if (room.accessLevel === 'department' && room.departmentId === userDpId) {
      return ( { x:room?.x + offset.x || offset.x , y:0 , z:room?.z + offset.z || offset.z } )
    }
  }
  return offset;
}

const initRoomSpawnPos = (rooms, roomName, positionData) => {
  const roomData = createRoom({
    roomName,
    positionData,
  })
  rooms.set(roomName, roomData);
  return roomData;
}

const initRoomComponents = async ( roomData ) => {
  if (!roomData) return ;
  if (roomData.roomName === 'Office') {

    const spacesRes = await apiClient.get('/spaces');
    if (spacesRes?.success && Array.isArray(spacesRes.data)) {
      roomData.positionData = generatePositionedPlanes(spacesRes.data);
    }

    const activeUsers = await apiClient.get('/users/status/online');
    const existingObjs = await getRoomObjs();
    const roomParticles = await createDustParticles();

    const count = activeUsers.length;
    console.log('num of active users: ', count);
		const trimUser = activeUsers.slice(0, 3);

    // trimUser.forEach(user => {
    activeUsers.forEach(user => {
      const existingPlayer = createPlayer({
        id: user.userId,
        userId: user.userId,
        name: user.userName || null,
		    dpId: user?.department?.dpId || 'guest',
        roomName: 'Office',
        position: getSpawnPosFromDpId(roomData, user?.department?.dpId || 'guest'),
        rotation: { x:-Math.PI/2, y:0, z:0 },
        color: randomHslColor("80"),
        photo: user.avatarUrl || null,
        audioEnabled: false,
        speaking: false,
      });
      roomData.users.push(existingPlayer);
      // console.log('existingPos: ', existingPlayer.position, ' ', existingPlayer.dpId);
    });
    roomData.objects.push(...existingObjs);
    roomData.particles.push(...roomParticles);
  }
}

// ### fetch roomObjects here, from db i guess
// admin setting -> db, then fetch db -> room
const initRoomData = async (rooms, roomName) => {
  const roomData = createRoom({
    roomName,
    users: [],
    objects: [],
    particles: [],
    positionData: [],
    createdAt: Date.now()
  });
  await initRoomComponents(roomData);
  rooms.set(roomName, roomData);
  return roomData
}

const roomInitLocks = new Map(); // Map<roomName, Promise<roomData>>

const getOrInitRoom = async (rooms, roomName) => {
  const existing = rooms.get(roomName);
  if (existing) return { roomData: existing, isNew: false };

  // if someone is initializing room ... wait for result
  if (roomInitLocks.has(roomName)) {
    const roomData = await roomInitLocks.get(roomName);
    return { roomData, isNew: false };
  }

  const initPromise = initRoomData(rooms, roomName);
  roomInitLocks.set(roomName, initPromise);
  try {
    const roomData = await initPromise;
    return { roomData, isNew: true };
  } finally {
    roomInitLocks.delete(roomName);
  }
};

module.exports = {
  initRoomData,
  createPlayer,
  randomPosition,
  initRoomSpawnPos,
  getSpawnPosFromDpId,
  initRoomComponents,
  getOrInitRoom,
};