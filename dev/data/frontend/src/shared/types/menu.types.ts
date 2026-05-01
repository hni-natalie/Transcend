// Type for the icon - can be ReactNode or a specific SVG component type
import { ReactNode } from 'react';

// Basic menu item type
export type MenuItem = {
  title: string;
  href: string;
  icon: ReactNode;  // This can be any React element (SVG, image, etc.)
//   subItems?: string[] | MenuSubItem[];
}

// maybe subitems can be room/s under office?
// If subItems are objects
// export type MenuSubItem = {
//   title: string;
//   href: string;
//   icon?: ReactNode;
// }

// Complete menu data type
export type MenuConfig = Array<MenuItem>;