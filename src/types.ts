export type Role = 'Werewolf' | 'Seer' | 'Witch' | 'Hunter' | 'Villager' | 'Cupid' | 'Little Girl' | 'Thief';

export interface Player {
  id: string; // User ID from storage
  socketId: string;
  name: string;
  role?: Role;
  isAlive: boolean;
  voteTarget?: string;
}

export type GamePhase = 'lobby' | 'night' | 'day' | 'voting';

export interface RoomState {
  id: string;
  moderatorId: string;
  players: Player[];
  status: GamePhase;
  deck: Record<Role, number>;
  votesRevealed: boolean;
}
