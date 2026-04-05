export type UserChipItem = {
  name: string;
  role: string;
  photo: string;
};

export type Player = {
  id: string;
  name?: string;
  position: { x:number ; y:number ; z:number };
  rotation: number;
  color: string;
}