export interface Room {
  players: Player[];
  spectators: string[];
  board: string[];
  currentRound: RoundEnum;
  roundStartTime?: Date;
  socketIds: Player[];
}

export interface Word {
  word: string;
  checked: boolean;
}
export enum RoundEnum {
  WAIT = -1,
  PLAY = 0,
  CLEAN_UP = 1,
  CHALLENGE = 2,
  RESULT = 3,
}

interface Player {
  id: string;
}
