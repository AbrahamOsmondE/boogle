import { Room, RoundEnum, Word } from "../dto/GameHandlersDto";

export const getRoomData = async (
  client: any,
  roomCode: string,
): Promise<Room | undefined> => {
  if (!roomCode) return;
  const roomJson = await client.HGET("rooms", roomCode);

  if (!roomJson) return;

  const room = JSON.parse(roomJson);

  return {
    ...room,
    roundStartTime: new Date(room.roundStartTime),
  };
};

export const generateRoomCode = () => {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
};

export const generateBoard = () => {
  const boggleDice = [
    ["A", "A", "E", "E", "G", "N"],
    ["E", "L", "R", "T", "T", "Y"],
    ["A", "O", "O", "T", "T", "W"],
    ["A", "B", "B", "J", "O", "O"],
    ["E", "H", "R", "T", "V", "W"],
    ["C", "I", "M", "O", "T", "U"],
    ["D", "I", "S", "T", "T", "Y"],
    ["E", "I", "O", "S", "S", "T"],
    ["D", "E", "L", "R", "V", "Y"],
    ["A", "C", "H", "O", "P", "S"],
    ["H", "I", "M", "N", "Qu", "U"],
    ["E", "E", "I", "N", "S", "U"],
    ["E", "E", "G", "H", "N", "W"],
    ["A", "F", "F", "K", "P", "S"],
    ["H", "L", "N", "N", "R", "Z"],
    ["D", "E", "I", "L", "R", "X"],
  ];

  const shuffledArray = [...boggleDice].sort(() => Math.random() - 0.5);

  return shuffledArray.map((die) => {
    const faceIndex = Math.floor(Math.random() * die.length);
    return die[faceIndex];
  });
};
export const counter = (
  words: string[] | Record<string, string>,
): Record<string, number> => {
  if (!words) return {};
  if (Array.isArray(words)) {
    return words.reduce((acc: Record<string, number>, curr: string) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});
  } else {
    return Object.keys(words).reduce(
      (acc: Record<string, number>, key: string) => {
        acc[key] = parseFloat(words[key]);
        return acc;
      },
      {},
    );
  }
};
export const generateWordChecklist = async (client, playerId: string) => {
  const wordObjects = await client.HGETALL(playerId);

  const words: string[] = Object.keys(wordObjects);
  const wordCount: Record<string, number> = counter(wordObjects);

  const arr = words.reduce((res: Word[], curr: string) => {
    if (wordCount[curr] > 0) {
      for (let i = 0; i < wordCount[curr]; i++) {
        res.push({
          word: curr,
          checked: true,
        });
      }
    } else {
      res.push({
        word: curr,
        checked: false,
      });
    }
    return res;
  }, []);

  return arr.length === 0 && playerId.endsWith("challenge") ? undefined : arr;
};

export const getWordKeys = (
  round: number,
  userId: string,
  opponentId: string,
): [string, string] => {
  switch (round) {
    case RoundEnum.PLAY:
      return [userId, opponentId];
    case RoundEnum.CLEAN_UP:
      return [userId, opponentId];
    case RoundEnum.CHALLENGE:
      return [`${userId}_challenge`, `${opponentId}_challenge`];
    case RoundEnum.RESULT:
      return [`${opponentId}_challenge`, `${userId}_challenge`];
    default:
      return [userId, opponentId];
  }
};
