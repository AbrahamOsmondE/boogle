import { redisClient } from "..";
import { Room, Word, RoundEnum } from "./dto/GameHandlersDto";
import {
  generateWordChecklist,
  getRoomData,
  generateRoomCode,
  generateBoard,
  counter,
} from "./utils/GameHandlers-utils";
import { sleep } from "./utils/test-utils";

export const registerGameHandlers = (io: any, socket: any) => {
  const createGame = async () => {
    const roomCode = generateRoomCode();

    const room: Room = {
      players: [{ id: socket.id }],
      spectators: [],
      board: generateBoard(),
      currentRound: RoundEnum.WAIT,
      socketIds: [{ id: socket.id }],
    };

    redisClient.HSET("rooms", roomCode, JSON.stringify(room));

    socket.join(roomCode);
    socket.emit("roomCreated", { roomCode, userId: socket.id, isPlayer: true });
  };

  const cancelRoomCreation = async (data: any) => {
    const { roomCode } = data;

    redisClient.HDEL("rooms", roomCode);

    socket.emit("roomCanceled");
  };

  const joinGame = async (data: any) => {
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
        currentRound: 1,
        roundStartTime: new Date(),
        socketIds: [...room.socketIds, { id: socket.id }],
      };

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
    redisClient.HSET("solutions", roomCode, JSON.stringify(solution));
  };

  const nextRound = async (data: any) => {
    const { userId, roomCode, words, stage } = data;

    const room = await getRoomData(redisClient, roomCode);

    if (!room) throw new Error("Room Not Found");

    const opponent = room.players.filter((p) => p.id !== userId);
    const opponentSocket = room.socketIds.filter((s) => s.id !== socket.id);

    const opponentId = opponent[0].id;
    const opponentSocketId = opponentSocket[0].id;

    const countObject = counter(words);

    const newRoundRoom: Room = {
      ...room,
      currentRound: stage + 1,
      roundStartTime: new Date(),
    };

    if (newRoundRoom.currentRound === RoundEnum.CLEAN_UP) {
      redisClient.HSET(userId, countObject);
    } else if (newRoundRoom.currentRound === RoundEnum.CHALLENGE) {
      redisClient.HSET(`${opponentId}_challenge`, countObject);

      socket.to(opponentSocketId).emit("challengeRound", {
        words: words.map((word: string) => {
          return { word, checked: true };
        }),
      });
    } else if (newRoundRoom.currentRound === RoundEnum.RESULT) {
      const solution = await redisClient.HGET("solutions", roomCode);

      socket.to(opponentSocketId).emit("resultRound", {
        playerWordList: words.map((word: string) => {
          return { word, checked: true };
        }),
        room,
        solution: JSON.parse(solution!),
      });

      await sleep(500);

      closeGame({
        userId,
        roomCode,
      });

      return;
    }

    redisClient.HSET("rooms", roomCode, JSON.stringify(newRoundRoom));
  };

  const goToNextRound = async (data: any) => {
    const { roomCode, stage } = data;

    const room = await getRoomData(redisClient, roomCode);

    if (!room) throw new Error("Room Not Found");

    if (room.socketIds.length == 2) {
      socket.emit("goToNextRound", { stage: stage + 1 });
    }
  };

  const rejoinGame = async (data: any) => {
    const { roomCode, userId } = data;
    const room = await getRoomData(redisClient, roomCode);
    if (!room) {
      socket.emit("roomDoesNotExist");
      return;
    }

    const board = room.board;
    let round = room.currentRound;

    const opponent = room.players.filter((p) => p.id !== userId);
    const opponentSocket = room.socketIds.filter((s) => s.id !== socket.id);

    const opponentId = opponent[0].id;
    const opponentSocketId = opponentSocket[0].id;

    // Get Date, and subtract from current time. If greater than 3 minutes, go to next round for opponent.
    const secondsElapsed =
      new Date().getTime() - room.roundStartTime!.getTime();
    const isRoundOver = secondsElapsed / 1000 >= 180;
    if (isRoundOver) {
      round = round + 1;

      const newRoundRoom: Room = {
        ...room,
        currentRound: round,
        roundStartTime: new Date(),
        socketIds: [...opponentSocket, { id: socket.id }],
      };

      redisClient.HSET("rooms", roomCode, JSON.stringify(newRoundRoom));
    }

    // `${opponentId}_challenge` refers to player's word for the opponent to challenge
    // Rejoin mid round, on play/cleanup: key = [userId, opponentId]
    // Rejoin mid round, on challenge: key = [`${userId}_challenge`, `${opponentId}_challenge`]
    // Rejoin after round end, on result: key = [`${opponentId}_challenge`, `${userId}_challenge`]
    const [userKey, opponentKey] = (() => {
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
    })();

    const words: Word[] = await generateWordChecklist(redisClient, userKey);
    const opponentWords: Word[] = await generateWordChecklist(
      redisClient,
      opponentKey,
    );
    const solutionsJson = await redisClient.HGET("solutions", roomCode);
    const solutions: Word[] = solutionsJson ? JSON.parse(solutionsJson) : [];

    if (isRoundOver) {
      socket.to(opponentSocketId).emit("opponentReconnected", {
        board,
        words,
        opponentWords,
        solutions,
        round,
      });
    }

    socket.emit("rejoinedRoom", {
      board,
      words,
      opponentWords,
      solutions,
      round,
      timeLeft: isRoundOver ? 180 : 180 - secondsElapsed / 1000,
    });
  };

  const disconnect = async (data: any) => {
    const { roomCode } = data;
    const room = await getRoomData(redisClient, roomCode);

    if (!room) {
      socket.emit("roomDoesNotExist");
      return;
    }
    const opponentSocket = room.socketIds.filter((s) => s.id !== socket.id);
    const newRoom: Room = {
      ...room,
      socketIds: opponentSocket,
    };

    redisClient.HSET("rooms", roomCode, JSON.stringify(newRoom));
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
  socket.on("game:edit_word", editWord); //done
  socket.on("game:disconnect", disconnect); //done
  socket.on("game:go_to_next_round", goToNextRound);
};
