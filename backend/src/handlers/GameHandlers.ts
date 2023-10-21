import { redisClient } from "..";
import { Room, Word, RoundEnum } from "./dto/GameHandlersDto";
import {
  generateWordChecklist,
  getRoomData,
  generateRoomCode,
  generateBoard,
  counter,
  getWordKeys,
} from "./utils/GameHandlers-utils";

const EXPIRY_TIME = 60 * 15;
export const registerGameHandlers = (io: any, socket: any) => {
  const createGame = async () => {
    redisClient.DEL(socket.id);
    redisClient.DEL(`${socket.id}_challenge`);
    redisClient.HDEL("rooms", socket.id);

    const roomCode = generateRoomCode();

    const room: Room = {
      players: [{ id: socket.id }],
      spectators: [],
      board: generateBoard(),
      currentRound: RoundEnum.WAIT,
      socketIds: [{ id: socket.id }],
    };

    redisClient.HSET("rooms", roomCode, JSON.stringify(room));
    redisClient.HSET("rooms", socket.id, roomCode);
    redisClient.expire("rooms", EXPIRY_TIME);

    socket.join(roomCode);
    socket.emit("roomCreated", { roomCode, userId: socket.id, isPlayer: true });
  };

  const cancelRoomCreation = async (data: any) => {
    const { roomCode } = data;

    redisClient.HDEL("rooms", roomCode);

    socket.emit("roomCanceled");
  };

  const joinGame = async (data: any) => {
    redisClient.DEL(socket.id);
    redisClient.DEL(`${socket.id}_challenge`);
    redisClient.HDEL("rooms", socket.id);

    const { roomCode } = data;

    try {
      const room = await getRoomData(redisClient, roomCode);

      if (!room) {
        socket.emit("roomNotFound");
        return;
      }

      if (room.players[0].id === socket.id) return;

      if (room.players.length === 2) {
        // TODO: Implement spectator
        socket.emit("fullRoom", { isPlayer: false });
        return;
      }
      const opponentId = room.players[0].id;

      const newRoom: Room = {
        ...room,
        players: [...room.players, { id: socket.id }],
        currentRound: RoundEnum.PLAY,
        roundStartTime: new Date(),
        socketIds: [...room.socketIds, { id: socket.id }],
      };

      redisClient.HSET("rooms", roomCode, JSON.stringify(newRoom));
      redisClient.HSET("rooms", socket.id, roomCode);

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

  const appendWord = async (data: any) => {
    const { userId, word, roomCode } = data;

    redisClient.HINCRBY(userId, word, 1);

    socket.to(roomCode).emit("wordAppended", { userId, word });
  };

  const updateWordStatus = (data: any) => {
    const { word, status, key } = data;

    if (status) {
      redisClient.HINCRBY(key, word, 1);
    } else {
      redisClient.HINCRBY(key, word, -1);
    }
  };

  const editWord = (data: any) => {
    const { userId, prevWord, word } = data;

    redisClient.HINCRBY(userId, prevWord, -1);
    redisClient.HINCRBY(userId, word, 1);
  };

  const setSolutions = (data: any) => {
    const { solution, roomCode } = data;

    if (!solution || !roomCode) return;
    redisClient.HSET("solutions", roomCode, JSON.stringify(solution));
  };

  const nextRound = async (data: any) => {
    const { userId, roomCode, words, stage } = data;

    const room = await getRoomData(redisClient, roomCode);

    if (!room) return;

    const opponent = room.players.filter((p) => p.id !== userId);

    const opponentId = opponent[0].id;

    const countObject = counter(words);
    const newRound = stage + 1;
    const countObjectLength = Object.keys(countObject).length;

    if (newRound === RoundEnum.CLEAN_UP) {
      if (countObjectLength) {
        redisClient.HSET(userId, countObject);
        redisClient.expire(userId, EXPIRY_TIME);
      }
    } else if (newRound === RoundEnum.CHALLENGE) {
      if (countObjectLength)
        redisClient.HSET(`${opponentId}_challenge`, countObject);
      redisClient.expire(`${opponentId}_challenge`, EXPIRY_TIME);
    } else if (newRound === RoundEnum.RESULT) {
      return;
    }
  };

  const goToNextRound = async (data: any) => {
    let solutions;
    try {
      const { roomCode, stage, userId } = data;

      const nextRoundPromise = nextRound(data);
      const room = await getRoomData(redisClient, roomCode);

      if (!room) return;
      const opponent = room.players.filter((p) => p.id !== userId);
      const opponentSocket = room.socketIds.filter((s) => s.id !== socket.id);

      const opponentId = opponent[0].id;

      await Promise.resolve(nextRoundPromise);

      const readyCount = await redisClient.HINCRBY("ready", roomCode, 1);
      const newStage = stage + 1;
      if (room.socketIds.length == 2 && readyCount == 2) {
        const [userKey, opponentKey] = getWordKeys(
          newStage,
          userId,
          opponentId,
        );

        const words =
          (await generateWordChecklist(redisClient, userKey)) ||
          ((await generateWordChecklist(redisClient, opponentId)) as Word[]);
        const opponentWords =
          (await generateWordChecklist(redisClient, opponentKey)) ||
          ((await generateWordChecklist(redisClient, userId)) as Word[]);

        const newRoundRoom: Room = {
          ...room,
          currentRound: newStage,
          roundStartTime: new Date(),
        };

        await redisClient.HSET("rooms", roomCode, JSON.stringify(newRoundRoom));
        const yourWord =
          newRoundRoom.currentRound === RoundEnum.RESULT
            ? words
            : words.filter((word) => word.checked);
        const oppWord =
          newRoundRoom.currentRound === RoundEnum.RESULT
            ? opponentWords
            : opponentWords.filter((word) => word.checked);
        await redisClient.HSET("ready", roomCode, 0);

        if (newRoundRoom.currentRound === RoundEnum.RESULT) {
          const solutionsJson = await redisClient.HGET("solutions", roomCode);
          solutions = solutionsJson ? JSON.parse(solutionsJson) : [];
        }

        socket.emit("goToNextRound", {
          stage: newStage,
          words: yourWord,
          opponentWords: oppWord,
          solutions,
        });
        const opponentSocketId = opponentSocket[0].id;

        socket.to(opponentSocketId).emit("goToNextRound", {
          stage: newStage,
          words: oppWord,
          opponentWords: yourWord,
          solutions,
        });
      }
    } catch (e) {
      console.error("an error has occured", e);
    }
  };

  const rejoinGame = async (data: any) => {
    const { roomCode, userId } = data;
    const room = await getRoomData(redisClient, roomCode);
    if (!room) {
      socket.emit("roomDoesNotExist");
      return;
    }
    if (room.socketIds.some((p) => p.id === socket.id)) return;

    const board = room.board;
    let round = room.currentRound;

    const opponent = room.players.filter((p) => p.id !== userId);
    const opponentSocket = room.socketIds.filter((s) => s.id !== socket.id);

    const opponentId = opponent[0].id;

    // Get Date, and subtract from current time. If greater than 3 minutes, go to next round for opponent.
    const secondsElapsed =
      (new Date().getTime() - room.roundStartTime!.getTime()) / 1000;
    const isRoundOver = secondsElapsed >= 180;
    if (isRoundOver) {
      round = round + 1;

      const newRoundRoom: Room = {
        ...room,
        currentRound: round,
        roundStartTime: new Date(),
        socketIds: [...opponentSocket, { id: socket.id }],
      };

      redisClient.HSET("rooms", socket.id, roomCode);
      redisClient.HSET("rooms", roomCode, JSON.stringify(newRoundRoom));
    } else {
      const newRoundRoom: Room = {
        ...room,
        currentRound: round,
        socketIds: [...opponentSocket, { id: socket.id }],
      };

      redisClient.HSET("rooms", socket.id, roomCode);
      redisClient.HSET("rooms", roomCode, JSON.stringify(newRoundRoom));
    }

    // `${opponentId}_challenge` refers to player's word for the opponent to challenge
    // Rejoin mid round, on play/cleanup: key = [userId, opponentId]
    // Rejoin mid round, on challenge: key = [`${userId}_challenge`, `${opponentId}_challenge`]
    // Rejoin after round end, on result: key = [`${opponentId}_challenge`, `${userId}_challenge`]
    const [userKey, opponentKey] = getWordKeys(round, userId, opponentId);

    let words =
      (await generateWordChecklist(redisClient, userKey)) ||
      ((await generateWordChecklist(redisClient, opponentId)) as Word[]);
    let opponentWords =
      (await generateWordChecklist(redisClient, opponentKey)) ||
      ((await generateWordChecklist(redisClient, userId)) as Word[]);
    const solutionsJson = await redisClient.HGET("solutions", roomCode);
    const solutions: Word[] = solutionsJson ? JSON.parse(solutionsJson) : [];

    if (isRoundOver) {
      if (round === RoundEnum.CHALLENGE) {
        words = words.filter((word) => word.checked);
        opponentWords = opponentWords.filter((word) => word.checked);
      } else if (round === RoundEnum.RESULT) {
        words = words.filter(
          (value, index, array) => array.indexOf(value) === index,
        );
        opponentWords = opponentWords.filter(
          (value, index, array) => array.indexOf(value) === index,
        );
      }
      const readyCount = await redisClient.HINCRBY("ready", roomCode, 1);

      if (readyCount !== 2) {
        socket.emit("goToNextRound", { stage: RoundEnum.WAIT });
        return;
      }

      const opponentSocketId = opponentSocket[0].id;
      socket.to(opponentSocketId).emit("opponentReconnected", {
        board,
        words: opponentWords,
        opponentWords: words,
        solutions,
        round,
      });

      await redisClient.HSET("ready", roomCode, 0);
    }

    socket.emit("rejoinedRoom", {
      board,
      words,
      opponentWords,
      solutions,
      round,
      timeLeft: isRoundOver ? 180 : 180 - Math.floor(secondsElapsed + 1),
    });
  };

  const disconnect = async (data: any) => {
    const roomCode = await redisClient.HGET("rooms", socket.id);

    const room = await getRoomData(redisClient, roomCode!);

    if (!room) {
      socket.emit("roomDoesNotExist");
      return;
    }
    const opponentSocket = room.socketIds.filter((s) => s.id !== socket.id);

    if (opponentSocket.length < 0) {
      closeGame({ roomCode, userId: room.players[0].id });
      closeGame({ roomCode, userId: room.players[1].id });
      return;
    }

    const newRoom: Room = {
      ...room,
      socketIds: opponentSocket,
    };

    redisClient.HSET("rooms", roomCode!, JSON.stringify(newRoom));
  };

  const closeGame = (data: any) => {
    const { userId, roomCode } = data;
    redisClient.DEL(userId);
    redisClient.DEL(`${userId}_challenge`);
    redisClient.DEL(roomCode);
    redisClient.HDEL("rooms", roomCode);
    redisClient.HDEL("rooms", userId);
    redisClient.HDEL("solutions", roomCode);
  };

  socket.on("game:create_room", createGame);
  socket.on("game:join_room", joinGame);
  socket.on("game:cancel_room", cancelRoomCreation);
  socket.on("game:append_word", appendWord);
  socket.on("game:update_word_status", updateWordStatus);
  socket.on("game:solution", setSolutions);
  socket.on("game:rejoin_room", rejoinGame);
  socket.on("game:end_room", closeGame);
  socket.on("game:edit_word", editWord);
  socket.on("disconnect", disconnect);
  socket.on("game:go_to_next_round", goToNextRound);
};
