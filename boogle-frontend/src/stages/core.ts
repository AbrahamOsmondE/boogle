export enum StageEnum {
  PLAY = 1,
  CLEANUP = 2,
  CHALLENGE = 3,
  RESULT = 4,
  WAIT = 0,
}

export interface Players {
  [key: string]: Words[];
}

export interface Words {
  word: string;
  checked: boolean;
}
