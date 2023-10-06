export enum StageEnum {
  PLAY = 0,
  CLEANUP = 1,
  CHALLENGE = 2,
  RESULT = 3,
  WAIT = 4,
}

export interface Players {
  [key: string]: Words[];
}

export interface Words {
  word: string;
  checked: boolean;
}
