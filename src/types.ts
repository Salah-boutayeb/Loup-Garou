export type Role = 'Werewolf' | 'Seer' | 'Witch' | 'Hunter' | 'Villager' | 'Cupid' | 'Little Girl' | 'Thief';

export interface Player {
  id: string; // User ID from storage
  socketId: string;
  name: string;
  role?: Role;
  isAlive: boolean;
  voteTarget?: string;
  isLover?: boolean;
}

export type GamePhase = 'lobby' | 'night' | 'day' | 'voting';
export type Winner = 'wolves' | 'villagers' | 'lovers' | null;

export interface NightData {
  wolfVotes: Record<string, string>;
  seerTarget?: string;
  witchHealTarget?: string;
  witchKillTarget?: string;
  witchHealUsed: boolean;
  witchKillUsed: boolean;
  cupidLovers: string[];
}

export interface RoomState {
  id: string;
  moderatorId: string;
  players: Player[];
  status: GamePhase;
  deck: Record<Role, number>;
  votesRevealed: boolean;
  winner?: Winner;
  nightData: NightData;
  firstNight: boolean;
  hunterRevengePlayerId?: string | null;
  thiefSwapped?: boolean;
  activeRole?: Role | null;
  lastNightDeaths?: string[];
}
