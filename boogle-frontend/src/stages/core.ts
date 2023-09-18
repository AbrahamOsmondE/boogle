export enum StageEnum {
  PLAY = 0,
  CLEANUP = 1,
  RESULT = 2,
  CHALLENGE = 3,
}

export interface Players {
  [key: string]: Words[];
}

export interface Words {
  word: string;
  checked: boolean;
}

export interface Solutions {
  [key: string]: string[];
}
