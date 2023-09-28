import { redisClient } from "..";

export const registerGameHandlers = (io: any, socket: any) => {
  const createGame = () => {
    const roomCode = generateRoomCode();

    const room: Room = {
      players: [{ id: socket.id }],
      spectators: [],
      board: generateBoard(),
      currentRound: RoundEnum.WAIT,
    };

    redisClient.HSET("rooms", roomCode, JSON.stringify(room));

    socket.join(roomCode);
    socket.emit("roomCreated", { roomCode, userId: socket.id, isPlayer: true });
  };

  const cancelRoomCreation = (data: any) => {
    const { roomCode } = data;

    redisClient.HDEL("rooms", roomCode);
  };

  const joinGame = async (data: any) => {
    const { roomCode } = data;

    try {
      const roomData = await redisClient.HGET("rooms", roomCode);

      if (!roomData) {
        socket.emit("roomNotFound");
        return;
      }

      const room = JSON.parse(roomData) as Room;

      if (room.players.length === 2) {
        // const playerOne = room.players[0];
        // const playerTwo = room.players[1];
        // socket.emit("joinedRoom", {
        //   roomCode,
        //   playerOne: {
        //     ...playerOne,
        //     words: await redisClient.LRANGE(playerOne.id, 0, -1),
        //   },
        //   playerTwo: {
        //     ...playerTwo,
        //     words: await redisClient.LRANGE(playerTwo.id, 0, -1),
        //   },
        //   isPlayer: false,
        //   currentRound: room.currentRound,
        // });
        // room.spectators.push(socket.id);
        // socket.join(`${roomCode}_spectate`);
        return;
      }
      const opponentId = room.players[0].id;

      const newRoom:Room = {
        ...room,
        players: [...room.players, {id: socket.id} ],
        currentRound: 1
      }

      redisClient.HSET("rooms", roomCode, JSON.stringify(newRoom));

      socket.join(roomCode);

      socket.emit("joinedRoom", {
        roomCode,
        userId: socket.id,
        isPlayer: true,
        board: room.board,
      });

      socket.to(opponentId).emit("initializeNextRound", { board: room.board });
    } catch (error) {
      console.error(error);
      socket.emit("roomJoiningError", { error });
    }
  };

  const appendWord = (data: any) => {
    const { userId, word, roomCode } = data;
    console.log("word appended:", word);

    redisClient.HINCRBY(userId, word, 1);

    socket.to(`${roomCode}_spectate`).emit("wordAppended", { userId, word });
  };

  const updateWordStatus = (data: any) => {
    const { word, status, key } = data;
    
    if (status) {
      console.log('word incremented: ', word);
      redisClient.HINCRBY(key, word, 1);
    } else {
      console.log('word decremented: ', word);
      redisClient.HINCRBY(key, word, -1);
    }
  };

  const setSolutions = (data: any) => {
    const { solution, roomCode } = data;
    redisClient.HSET("solutions", roomCode, JSON.stringify(solution));
  };

  const nextRound = async (data: any) => {
    const { userId, roomCode, words, stage } = data;

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
      currentRound: stage + 1,
    };

    if (newRoundRoom.currentRound === RoundEnum.CLEAN_UP) {
      redisClient.HSET(roomCode, userId, JSON.stringify(words));

      redisClient.HSET(userId, countObject);
    } else if (newRoundRoom.currentRound === RoundEnum.CHALLENGE) {
      console.log('challenge')
      redisClient.HSET(roomCode, userId, JSON.stringify(words));

      redisClient.HSET(`${opponentId}_challenge`, countObject);
      socket.to(opponentId).emit("challengeRound", { words:countObject });
    } else if (newRoundRoom.currentRound === RoundEnum.RESULT) {
      const playerWordListPromise = generateWordChecklist(userId);
      const opponentWordList = words;

      const solutionPromise = redisClient.HGET("solutions", roomCode);

      closeGame({
        userId,
        roomCode,
      });

      const [playerWordList, solution] = await Promise.all([
        playerWordListPromise,
        solutionPromise,
      ]);
      socket.to(userId).emit("resultRound", {
        playerWordList,
        opponentWordList,
        room,
        solution: JSON.parse(solution!),
      });
    }

    redisClient.HSET("rooms", roomCode, JSON.stringify(newRoundRoom));
  };

  const rejoinGame = async (data: any) => {
    //handle disconnecting past round time, handle loading and handle when user disconnect.
    const { roomCode, userId } = data;
    const roomJson = await redisClient.HGET("rooms", roomCode);
    if (!roomJson) socket.emit("roomDoesNotExist");

    const room: Room = JSON.parse(roomJson!);
    const board = room.board;
    const round = room.currentRound;

    const opponent = room.players.filter((p) => {
      return p.id !== userId;
    });

    const opponentId = opponent[0].id;
    const words: Word[] = await generateWordChecklist(userId);
    const opponentWords: Word[] = await generateWordChecklist(opponentId);
    const solutionsJson = await redisClient.HGET("solutions", roomCode);
    const solutions: Word[] = solutionsJson ? JSON.parse(solutionsJson) : [];

    socket.emit("rejoinedRoom", {
      board,
      words,
      opponentWords,
      solutions,
      round,
    });
  };

  const closeGame = (data: any) => {
    const { userId, roomCode } = data;
    redisClient.DEL(userId);
    redisClient.DEL(`${userId}_challenge`);
    redisClient.DEL(roomCode);
    redisClient.HDEL("rooms", roomCode);
    redisClient.HDEL("solutions", roomCode);
  };

  socket.on("game:create_room", createGame); //done
  socket.on("game:join_room", joinGame); //done
  socket.on("game:cancel_room", cancelRoomCreation); //done
  socket.on("game:append_word", appendWord); //done
  socket.on("game:update_word_status", updateWordStatus); //done
  socket.on("game:solution", setSolutions); //done
  socket.on("game:next_round", nextRound); //done
  socket.on("game:rejoin_room", rejoinGame); //done
  socket.on("game:end_room", closeGame); //done
};

const generateRoomCode = () => {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
};

const generateBoard = () => {
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

  const boggleBoard = [];

  for (let i = 0; i < 16; i++) {
    const dieIndex = Math.floor(Math.random() * boggleDice.length);
    const dieFaces = boggleDice[dieIndex];
    const faceIndex = Math.floor(Math.random() * dieFaces.length);
    boggleBoard.push(dieFaces[faceIndex]);
  }

  return boggleBoard;
};

const generateWordChecklist = async (playerId: string) => {
  const wordObjects = await redisClient.HGETALL(playerId);
  const words: string[] = Object.keys(wordObjects);
  const wordCount: Record<string, number> = Object.keys(wordObjects).reduce(
    (acc: Record<string, number>, key: string) => {
      acc[key] = parseFloat(wordObjects[key]);
      return acc;
    },
    {},
  );

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
  board: string[];
  currentRound: RoundEnum;
}

interface Player {
  id: string;
}

interface Word {
  word: string;
  checked: boolean;
}
enum RoundEnum {
  WAIT = -1,
  PLAY = 0,
  CLEAN_UP = 1,
  CHALLENGE = 2,
  RESULT = 3,
}
