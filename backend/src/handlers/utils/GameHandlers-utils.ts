import { Room, Word } from "../dto/GameHandlersDto";

export const getRoomData = async (
  client: any,
  roomCode: string,
): Promise<Room | undefined> => {
  const roomJson = await client.HGET("rooms", roomCode);

  if (!roomJson) return;

  return JSON.parse(roomJson);
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

  return words.reduce((res: Word[], curr: string) => {
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
};
