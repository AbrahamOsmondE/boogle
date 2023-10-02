import { redisClient } from "..";
import { Room, Word, RoundEnum } from "./dto/GameHandlersDto";
import { generateWordChecklist, getRoomData, generateRoomCode, generateBoard, counter } from "./utils/GameHandlers-utils";
import { sleep } from "./utils/test-utils";

export const registerGameHandlers = (io: any, socket: any) => {
  const createGame = async () => {
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

  const cancelRoomCreation = async (data: any) => {
    const { roomCode } = data;

    redisClient.HDEL("rooms", roomCode);

    socket.emit('roomCanceled')
  };

  const joinGame = async (data: any) => {
    const { roomCode } = data;

    try {
      const room = await getRoomData(redisClient, roomCode)

      if (!room) {
        socket.emit("roomNotFound");
        return;
      }

      if (room.players[0].id === socket.id) return

      if (room.players.length === 2) {
        // TODO: Implement spectator
        socket.emit('fullRoom', {isPlayer:false})
        return
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
    const {userId, prevWord, word} = data

    redisClient.HINCRBY(userId, prevWord, -1);
    redisClient.HINCRBY(userId, word, 1)
  }

  const setSolutions = (data: any) => {
    const { solution, roomCode } = data;
    redisClient.HSET("solutions", roomCode, JSON.stringify(solution));
  };

  const nextRound = async (data: any) => {
    const { userId, roomCode, words, stage } = data;

    const room = await getRoomData(redisClient, roomCode)

    if (!room) throw new Error('Room Not Found')

    const opponent = room.players.filter((p) => {
      return p.id !== userId;
    });

    const opponentId = opponent[0].id;

    const countObject = counter(words)

    const newRoundRoom: Room = {
      ...room,
      currentRound: stage + 1,
    };

    if (newRoundRoom.currentRound === RoundEnum.CLEAN_UP) {
      redisClient.HSET(userId, countObject);
    } else if (newRoundRoom.currentRound === RoundEnum.CHALLENGE) {      
      redisClient.HSET(`${opponentId}_challenge`, countObject);

      socket.to(opponentId).emit("challengeRound", { words:words.map((word:string) => {return {word,checked:true}}) });
    } else if (newRoundRoom.currentRound === RoundEnum.RESULT) {
      const solution = await redisClient.HGET("solutions", roomCode);

      socket.to(opponentId).emit("resultRound", { 
        playerWordList:words.map((word:string) => {return {word,checked:true}}),
        room,
        solution: JSON.parse(solution!),
      });

      await sleep(500)

      closeGame({
        userId,
        roomCode,
      });

      return
    }

    redisClient.HSET("rooms", roomCode, JSON.stringify(newRoundRoom));
  };

  const rejoinGame = async (data: any) => {
    const { roomCode, userId } = data;
    const room = await getRoomData(redisClient, roomCode)
    if (!room) {
      socket.emit("roomDoesNotExist")
      return
    };

    const board = room.board;
    const round = room.currentRound;

    const opponent = room.players.filter((p) => {
      return p.id !== userId;
    });
    const opponentId = opponent[0].id;

    const [userKey, opponentKey] = round === RoundEnum.CHALLENGE ? [userId, opponentId] : [`${userId}_challenge`, `${opponentId}_challenge`]
  
    const words: Word[] = await generateWordChecklist(redisClient, userKey);
    const opponentWords: Word[] = await generateWordChecklist(redisClient, opponentKey);
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
  socket.on("game:edit_word", editWord); //done
};
