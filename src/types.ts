export type Role = 'Werewolf' | 'Seer' | 'Witch' | 'Hunter' | 'Villager';

export interface Player {
  id: string; // User ID from storage
  socketId: string;
  name: string;
  role?: Role;
  isAlive: boolean;
}

export interface RoomState {
  id: string;
  moderatorId: string;
  players: Player[];
  status: 'lobby' | 'playing';
}

