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
  position: Position;
  // position: { x:number ; y:number ; z:number };
  rotation: number;
  color: string;
}