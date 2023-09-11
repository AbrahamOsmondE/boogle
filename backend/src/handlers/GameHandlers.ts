import { redisClient } from "..";

export const registerGameHandlers = (io: any, socket: any) => {
  const createGame = (data: any) => {
    const { playerName } = data;
    const roomCode = generateRoomCode();

    const room: Room = {
      players: [{ id: socket.id, name: playerName }],
      spectators: [],
      board: generateBoard(),
      roundStartTime: undefined,
      currentRound: RoundEnum.WAIT,
    };

    redisClient.HSET("rooms", roomCode, JSON.stringify(room));

    socket.join(roomCode);
    socket.emit("roomCreated", { roomCode, userId: socket.id, isPlayer: true });
  };

  const cancelRoomCreation = (data: any) => {
    const { roomCode, userId } = data;

    redisClient.HDEL("rooms", roomCode);
    redisClient.HDEL("rooms", userId);
  };

  const joinGame = async (data: any) => {
    const { roomCode, playerName } = data;

    try {
      const roomData = await redisClient.HGET("rooms", roomCode);

      if (!roomData) {
        socket.emit("roomNotFound");
        return;
      }

      const room = JSON.parse(roomData) as Room;

      if (room.players.length === 2) {
        const playerOne = room.players[0];
        const playerTwo = room.players[1];
        socket.emit("joinedRoom", {
          roomCode,
          playerOne: {
            ...playerOne,
            words: await redisClient.LRANGE(playerOne.id, 0, -1),
          },
          playerTwo: {
            ...playerTwo,
            words: await redisClient.LRANGE(playerTwo.id, 0, -1),
          },
          isPlayer: false,
          currentRound: room.currentRound,
        });
        room.spectators.push(socket.id);
        socket.join(`${roomCode}_spectate`);
        return;
      }
      const opponentId = room.players[0];
      room.players.push({ id: socket.id, name: playerName });

      room.roundStartTime = new Date().toISOString();
      room.currentRound = 1;

      redisClient.HSET("rooms", roomCode, JSON.stringify(room));

      socket.join(roomCode);

      socket.emit("joinedRoom", {
        roomCode,
        userId: socket.id,
        isPlayer: true,
      });
      socket.to(opponentId).emit("initializeNextRound");
    } catch (error) {
      console.error(error);
      socket.emit("roomJoiningError");
    }
  };

  const appendWord = (data: any) => {
    const { userId, word, roomCode } = data;

    redisClient.LPUSH(userId, word);

    socket.to(`${roomCode}_spectate`).emit("wordAppended", { userId, word });
  };

  const updateWordStatus = (data: any) => {
    const { userId, word, status, round } = data;
    const key = round === RoundEnum.CLEAN_UP ? userId : `${userId}_challenge`;
    if (status) redisClient.HINCRBY(key, word, 1);
    else redisClient.HINCRBY(key, word, -1);
  };

  const getSolutions = (data: any) => {
    const { solution, roomCode } = data;
    redisClient.HSET("solutions", roomCode, JSON.stringify(solution));
  };

  const nextRound = async (data: any) => {
    const { userId, roomCode, words } = data;

    const roomJson = await redisClient.HGET("rooms", roomCode);
    const room = JSON.parse(roomJson!) as Room;

    const opponent = room.players.filter((p) => {
      return p.id !== userId;
    });

    const opponentId = opponent[0].id;

    const countObject: Record<string, number> = words.reduce(
      (acc: Record<string, number>, curr: string) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      },
      {},
    );

    const newRoundRoom: Room = {
      ...room,
      currentRound: room.currentRound + 1,
      roundStartTime: new Date().toISOString(),
    };
    if (newRoundRoom.currentRound === RoundEnum.CLEAN_UP) {
      redisClient.HSET(roomCode, userId, JSON.stringify(words));

      redisClient.HSET(userId, countObject);
    } else if (newRoundRoom.currentRound === RoundEnum.CHALLENGE) {
      redisClient.HSET(roomCode, userId, JSON.stringify(words));

      redisClient.HSET(`${opponentId}_challenge`, countObject);
      socket.to(opponentId).emit("challengeRound", { words });
    } else if (newRoundRoom.currentRound === RoundEnum.RESULT) {
      const playerWordList = generateWordChecklist([], {}); //TODO
      const opponentWordList = generateWordChecklist([], {}); //TODO
      const solution = await redisClient.HGET("solutions", roomCode);
      socket.to(opponentId).emit("resultRound", {
        playerWordList,
        opponentWordList,
        room,
        solution: JSON.parse(solution!),
      });
    }

    redisClient.HSET("rooms", roomCode, JSON.stringify(newRoundRoom));
  };

  const rejoinGame = (data: any) => {
    /* IMPORTANT TODO: Upon disconnect, round will continue but will pause once it ends 
    and wait for disconnect. Opponent can close the room during the loading. Once player 
    rejoins, determine if round is over and use cache to proceed to the next round */

  };

  const closeGame = (data: any) => {
    const { userId } = data;
    redisClient.DEL(userId);
  };

  socket.on("game:create_room", createGame);
  socket.on("game:join_room", joinGame);
  socket.on("game:cancel_room", cancelRoomCreation);
  socket.on("game:append_word", appendWord);
  socket.on("game:update_word_status", updateWordStatus);
  socket.on("game:solution", getSolutions);
  socket.on("game:next_round", nextRound);
  socket.on("game:rejoin_room", rejoinGame);
  socket.on("gane:end_room", closeGame);
};

const generateRoomCode = () => {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
};

const generateBoard = () => {
  return "";
};

const generateWordChecklist = (
  words: string[],
  wordCount: Record<string, number>,
) => {
  return words.reduce((res: Word[], curr: string) => {
    if (wordCount[curr] >= 0) {
      res.push({
        word: curr,
        checked: true,
      });
      wordCount[curr] -= 1;
    } else {
      res.push({
        word: curr,
        checked: false,
      });
    }
    return res;
  }, []);
};

interface Room {
  players: Player[];
  spectators: string[];
  board: string;
  roundStartTime?: string;
  currentRound: RoundEnum;
}

interface Player {
  id: string;
  name: string;
}

interface Word {
  word: string;
  checked: boolean;
}
enum RoundEnum {
  WAIT = 0,
  PLAY = 1,
  CLEAN_UP = 2,
  CHALLENGE = 3,
  RESULT = 4,
}
