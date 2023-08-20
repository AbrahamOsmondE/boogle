export enum StageEnum {
  PLAY = 0,
  CLEANUP = 1,
  RESULT = 2,
}

export interface Players {
  [key: string]: Words[];
}

interface Words {
  word: string;
  checked: boolean;
}
