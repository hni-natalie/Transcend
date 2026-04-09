export type UserChipItem = {
  name: string;
  role: string;
  photo: string;
};

export type Position = {
  x:number,
  y:number,
  z:number,
}

export type Player = {
  id: string;
  name?: string;
  roomName?: string;
  position: Position;
  rotation: number;
  color: string;
  audioEnabled: boolean;
  speaking: boolean;
}