export enum StageEnum {
  PLAY = 0,
  CLEANUP = 1,
  CHALLENGE = 2,
  RESULT = 3,
  WAIT = -1,
}

export const ROUND_TIME = 30;
export interface Players {
  [key: string]: Words[];
}

export interface Words {
  word: string;
  checked: boolean;
}
