import io from "socket.io-client";
import { createClient } from "redis";
import {
  PlayerData,
  createRoom,
  createSocketPromise,
  endCurrentRound,
  generateRandomWords,
  joinRoom,
  sleep,
} from "./utils/test-utils";
import {
  counter,
  generateWordChecklist,
  getRoomData,
} from "./utils/GameHandlers-utils";
import { Room } from "./dto/GameHandlersDto";

const webSocketUrl =
  process.env.REACT_APP_WEBSOCKET_URL || "http://localhost:8000";

const client = io(webSocketUrl);
const opponentClient = io(webSocketUrl);
const spectatorClient = io(webSocketUrl);

const redisClient = createClient();
const sleepClient = {
  emit: async (keyword, data) => {
    client.emit(keyword, data);
    await sleep(200);
  },
  disconnect: async () => {
    client.disconnect();
    await sleep(200);
  },
};
const sleepOpponentClient = {
  emit: async (keyword, data) => {
    opponentClient.emit(keyword, data);
    await sleep(200);
  },
  disconnect: async () => {
    opponentClient.disconnect();
    await sleep(200);
  },
};

describe("test game handler", () => {
  beforeAll(async () => {
    redisClient.on("error", (err) => console.log("Redis Client Error", err));

    await redisClient.connect();
  });

  beforeEach(async () => {
    await redisClient.flushAll();
  });

  afterAll(() => {
    client.close();
    opponentClient.close();
    spectatorClient.close();
    redisClient.quit();
  });

  it("should create a new room", async () => {
    const { roomCode, userId, isPlayer } = await createRoom(client);

    expect(roomCode).toBeDefined();
    expect(userId).toBeDefined();
    expect(isPlayer).toEqual(true);

    const room = (await getRoomData(redisClient, roomCode)) as Room;

    expect(room.board).toBeDefined();
    expect(room.board.length).toEqual(16);
    expect(room.currentRound).toEqual(-1);
    expect(room.players[0].id).toEqual(client.id);
  });

  it("should cancel room creation", async () => {
    const { roomCode } = await createRoom(client);

    const cancelRoomPromise = createSocketPromise(
      client,
      "roomCanceled",
      (data) => data,
    );
    await sleepClient.emit("game:cancel_room", { roomCode });

    await cancelRoomPromise;

    const room = (await getRoomData(redisClient, roomCode)) as Room;
    expect(room).toBeUndefined();
  });

  it("should join and initialize game succesfully", async () => {
    const { roomCode } = await createRoom(client);
    const initializeNextRoundPromise = createSocketPromise(
      client,
      "initializeNextRound",
      (data) => data,
    ) as Promise<Room>;
    const {
      roomCode: roomCodeOpponent,
      userId,
      isPlayer,
      board,
    } = await joinRoom(opponentClient, roomCode);
    const room = (await getRoomData(redisClient, roomCode)) as Room;
    const playerOneData = await initializeNextRoundPromise;

    expect(roomCodeOpponent).toEqual(roomCode);
    expect(userId).toEqual(opponentClient.id);
    expect(isPlayer).toEqual(true);
    expect(board).toEqual(room.board);
    expect(board).toEqual(playerOneData.board);
  });

  it("should not join a non existing room", async () => {
    await createRoom(client);

    const roomNotFoundPromise = createSocketPromise(
      opponentClient,
      "roomNotFound",
      (data) => data,
    );

    joinRoom(opponentClient, "mockRoomCode");

    const data = await roomNotFoundPromise;

    expect(data).toBeUndefined();
  });

  it("should not join a full room", async () => {
    const { roomCode } = await createRoom(client);

    await joinRoom(opponentClient, roomCode);

    const fullRoomPromise = createSocketPromise(
      spectatorClient,
      "fullRoom",
      (data) => data,
    );

    joinRoom(spectatorClient, roomCode);
    const data = await fullRoomPromise;

    expect(data.isPlayer).toEqual(false);
  });

  it("should append word", async () => {
    const { roomCode, userId } = await createRoom(client);
    await joinRoom(opponentClient, roomCode);

    const word = "BOOGLE";
    const promise = createSocketPromise(
      opponentClient,
      "wordAppended",
      (data) => data,
    ) as Promise<PlayerData>;
    await sleepClient.emit("game:append_word", { roomCode, userId, word });

    const data = await promise;

    const wordCount = await redisClient.HGET(userId, word);

    expect(wordCount).toEqual("1");
    expect(data.userId).toEqual(userId);
    expect(data.word).toEqual(word);
  });

  it("should update word status", async () => {
    const { roomCode, userId } = await createRoom(client);
    await joinRoom(opponentClient, roomCode);

    const word = "BOOGLE";
    await redisClient.HINCRBY(userId, word, 1);

    await sleepClient.emit("game:update_word_status", {
      word,
      status: false,
      key: userId,
    });

    const newCount = await redisClient.HGET(userId, word);
    await sleepClient.emit("game:update_word_status", {
      word,
      status: true,
      key: userId,
    });

    const newNewCount = await redisClient.HGET(userId, word);

    expect(newCount).toEqual("0");
    expect(newNewCount).toEqual("1");
  });

  it("should set solutions", async () => {
    await sleepClient.emit("game:solution", {
      solution: [{ word: "test", checked: true }],
      roomCode: "testroom",
    });

    const solutionJson = await redisClient.HGET("solutions", "testroom");
    const solution = JSON.parse(solutionJson!);

    expect(solutionJson).toBeDefined();
    expect(solution[0].word).toEqual("test");
    expect(solution[0].checked).toEqual(true);
  });

  it("should proceed to clean up round with idempotency", async () => {
    const { roomCode, userId } = await createRoom(client);
    const { userId: opponentId } = await joinRoom(opponentClient, roomCode);

    const playerWords = generateRandomWords(10);
    const opponentWords = generateRandomWords(15);

    client.emit("game:go_to_next_round", {
      roomCode,
      stage: 0,
      userId,
      words: playerWords,
    });
    await sleepOpponentClient.emit("game:go_to_next_round", {
      roomCode,
      stage: 0,
      userId: opponentId,
      words: opponentWords,
    });

    const cachedPlayerWords = await redisClient.HGETALL(userId);
    const cachedOpponentWords = await redisClient.HGETALL(opponentId);

    expect(counter(playerWords)).toEqual(counter(cachedPlayerWords));
    expect(counter(opponentWords)).toEqual(counter(cachedOpponentWords));

    const newRoundRoomJson = await redisClient.HGET("rooms", roomCode);
    const newRoundRoom = JSON.parse(newRoundRoomJson!);

    expect(newRoundRoom.currentRound).toEqual(1);
  });

  it("should proceed to challenge round", async () => {
    const { roomCode, userId } = await createRoom(client);
    const { userId: opponentId } = await joinRoom(opponentClient, roomCode);

    const playerWords = generateRandomWords(10);
    const opponentWords = generateRandomWords(15);

    const playerChallengeRoundPromise = createSocketPromise(
      client,
      "goToNextRound",
      (data) => data,
    );
    const opponentChallengeRoundPromise = createSocketPromise(
      opponentClient,
      "goToNextRound",
      (data) => data,
    );

    sleepClient.emit("game:go_to_next_round", {
      userId,
      roomCode,
      words: playerWords,
      stage: 1,
    });
    await sleepOpponentClient.emit("game:go_to_next_round", {
      userId: opponentId,
      roomCode,
      words: opponentWords,
      stage: 1,
    });

    const newRoundRoomJson = await redisClient.HGET("rooms", roomCode);
    const newRoundRoom = JSON.parse(newRoundRoomJson!);

    const [playerReceivedData, opponentReceivedData] = await Promise.all([
      playerChallengeRoundPromise,
      opponentChallengeRoundPromise,
    ]);

    expect(newRoundRoom.currentRound).toEqual(2);
    expect(playerReceivedData.words).toEqual(
      opponentWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(playerReceivedData.words).toEqual(
      opponentReceivedData.opponentWords,
    );
    expect(opponentReceivedData.words).toEqual(
      playerWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(playerReceivedData.opponentWords).toEqual(
      opponentReceivedData.words,
    );
  });

  it("should proceed to result round and close room", async () => {
    const { roomCode, userId } = await createRoom(client);
    const { userId: opponentId } = await joinRoom(opponentClient, roomCode);

    await redisClient.HSET("solutions", roomCode, '["word"]');
    const playerWords = generateRandomWords(10);
    const opponentWords = generateRandomWords(15);

    await redisClient.HSET(`${opponentId}_challenge`, counter(playerWords));
    await redisClient.HSET(`${userId}_challenge`, counter(opponentWords));
    const playerResultRoundPromise = createSocketPromise(
      client,
      "goToNextRound",
      (data) => data,
    );
    const opponentResultRoundPromise = createSocketPromise(
      opponentClient,
      "goToNextRound",
      (data) => data,
    );

    sleepClient.emit("game:go_to_next_round", {
      userId,
      roomCode,
      words: opponentWords,
      stage: 2,
    });
    await sleepOpponentClient.emit("game:go_to_next_round", {
      userId: opponentId,
      roomCode,
      words: playerWords,
      stage: 2,
    });

    const [playerReceivedData, opponentReceivedData] = await Promise.all([
      playerResultRoundPromise,
      opponentResultRoundPromise,
    ]);

    expect(playerReceivedData.solutions).toEqual(["word"]);
    expect(playerReceivedData.solutions).toEqual(
      opponentReceivedData.solutions,
    );
    expect(playerReceivedData.words).toEqual(
      playerWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(playerReceivedData.words).toEqual(
      opponentReceivedData.opponentWords,
    );
    expect(opponentReceivedData.words).toEqual(
      opponentWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(playerReceivedData.opponentWords).toEqual(
      opponentReceivedData.words,
    );
  });

  it("should disconnect user and remove socket", async () => {
    const newOppClient = io(webSocketUrl);

    const { roomCode, userId } = await createRoom(client);
    const { userId: opponentId } = await joinRoom(newOppClient, roomCode);

    await sleep(500);

    const room = (await getRoomData(redisClient, roomCode)) as Room;

    expect(room.socketIds.length).toEqual(2);
    expect(room.socketIds).toEqual([{ id: userId }, { id: opponentId }]);

    newOppClient.disconnect();

    await sleep(500);

    const newRoom = (await getRoomData(redisClient, roomCode)) as Room;

    expect(newRoom.socketIds.length).toEqual(1);
    expect(newRoom.socketIds).toEqual([{ id: userId }]);

    newOppClient.close();
  });

  it("should proceed to next round when both users are connexted and ready", async () => {
    const { roomCode, userId } = await createRoom(client);
    const { userId: opponentId } = await joinRoom(opponentClient, roomCode);

    const playerWords = generateRandomWords(10);
    const opponentWords = generateRandomWords(15);

    await sleepClient.emit("game:go_to_next_round", {
      roomCode,
      stage: 0,
      userId,
      words: playerWords,
    });

    const newRoom = (await getRoomData(redisClient, roomCode)) as Room;

    expect(newRoom.currentRound).toEqual(0);

    const oppNextRoundPromise = createSocketPromise(
      opponentClient,
      "goToNextRound",
      (data) => data,
    );

    await sleepOpponentClient.emit("game:go_to_next_round", {
      roomCode,
      stage: 0,
      userId: opponentId,
      words: opponentWords,
    });

    const { stage: oppStage } = await oppNextRoundPromise;
    const oppNewRoom = (await getRoomData(redisClient, roomCode)) as Room;

    expect(oppNewRoom.currentRound).toEqual(1);
    expect(oppStage).toEqual(1);
  });

  it("should reconnect mid game during play round", async () => {
    const newClient = io(webSocketUrl);

    const { roomCode, userId } = await createRoom(newClient);
    const { userId: opponentId, board } = await joinRoom(
      opponentClient,
      roomCode,
    );

    const playerWords = counter(generateRandomWords(10));
    const opponentWords = counter(generateRandomWords(15));

    await redisClient.HSET(userId, playerWords);
    await redisClient.HSET(opponentId, opponentWords);

    newClient.disconnect();

    await sleep(500);

    const rejoinedRoomPromise = createSocketPromise(
      newClient,
      "rejoinedRoom",
      (data) => data,
    );

    newClient.connect();

    newClient.emit("game:rejoin_room", { roomCode, userId });

    const data = await rejoinedRoomPromise;

    expect(data.board).toEqual(board);
    expect(data.words).toEqual(
      Object.keys(playerWords).map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.opponentWords).toEqual(
      Object.keys(opponentWords).map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.round).toEqual(0);
    expect(data.timeLeft).toBeGreaterThan(0);

    newClient.close();
  });

  it("should reconnect mid game during clean up round", async () => {
    const newClient = io(webSocketUrl);

    const { roomCode, userId } = await createRoom(newClient);
    const { userId: opponentId, board } = await joinRoom(
      opponentClient,
      roomCode,
    );

    const playerWords = generateRandomWords(10);
    const opponentWords = generateRandomWords(15);

    newClient.emit("game:go_to_next_round", {
      roomCode,
      userId,
      words: playerWords,
      stage: 0,
    });
    await sleepOpponentClient.emit("game:go_to_next_round", {
      roomCode,
      userId: opponentId,
      words: opponentWords,
      stage: 0,
    });
    newClient.disconnect();

    await sleep(500);
    const rejoinedRoomPromise = createSocketPromise(
      newClient,
      "rejoinedRoom",
      (data) => data,
    );

    newClient.connect();
    newClient.emit("game:rejoin_room", { roomCode, userId });
    const data = await rejoinedRoomPromise;

    expect(data.board).toEqual(board);
    expect(data.words).toEqual(
      playerWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.opponentWords).toEqual(
      opponentWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.round).toEqual(1);
    expect(data.timeLeft).toBeGreaterThan(0);
    expect(data.timeLeft).toBeLessThan(180);

    newClient.close();
  });

  it("should reconnect mid game during challenge round", async () => {
    const newClient = io(webSocketUrl);

    const { roomCode, userId } = await createRoom(newClient);
    const { userId: opponentId, board } = await joinRoom(
      opponentClient,
      roomCode,
    );

    const playerWords = generateRandomWords(10);
    const opponentWords = generateRandomWords(15);

    newClient.emit("game:go_to_next_round", {
      roomCode,
      userId,
      words: playerWords,
      stage: 1,
    });
    newClient.emit("game:go_to_next_round", { roomCode, stage: 1 });
    opponentClient.emit("game:go_to_next_round", { roomCode, stage: 1 });
    await sleepOpponentClient.emit("game:go_to_next_round", {
      roomCode,
      userId: opponentId,
      words: opponentWords,
      stage: 1,
    });

    newClient.disconnect();

    await sleep(500);

    const rejoinedRoomPromise = createSocketPromise(
      newClient,
      "rejoinedRoom",
      (data) => data,
    );

    newClient.connect();
    newClient.emit("game:rejoin_room", { roomCode, userId });
    const data = await rejoinedRoomPromise;

    expect(data.board).toEqual(board);
    expect(data.words).toEqual(
      opponentWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.opponentWords).toEqual(
      playerWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.round).toEqual(2);
    expect(data.timeLeft).toBeGreaterThan(0);
    expect(data.timeLeft).toBeLessThan(180);

    newClient.close();
  });

  it("should reconnect during result round", async () => {
    const newClient = io(webSocketUrl);

    const { roomCode, userId } = await createRoom(newClient);
    const { userId: opponentId, board } = await joinRoom(
      opponentClient,
      roomCode,
    );

    const playerWords = generateRandomWords(10);
    const opponentWords = generateRandomWords(15);

    await redisClient.HSET(`${opponentId}_challenge`, counter(playerWords));
    await redisClient.HSET(`${userId}_challenge`, counter(opponentWords));

    newClient.emit("game:go_to_next_round", {
      roomCode,
      userId,
      words: playerWords,
      stage: 2,
    });

    await sleepOpponentClient.emit("game:go_to_next_round", {
      roomCode,
      userId: opponentId,
      words: opponentWords,
      stage: 2,
    });

    newClient.disconnect();

    await sleep(500);

    const rejoinedRoomPromise = createSocketPromise(
      newClient,
      "rejoinedRoom",
      (data) => data,
    );

    newClient.connect();
    newClient.emit("game:rejoin_room", { roomCode, userId });
    const data = await rejoinedRoomPromise;

    expect(data.board).toEqual(board);
    expect(data.words).toEqual(
      playerWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.opponentWords).toEqual(
      opponentWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.round).toEqual(3);
    expect(data.timeLeft).toBeGreaterThan(0);
    expect(data.timeLeft).toBeLessThan(180);

    newClient.close();
  });

  it("should reconnect to clean up round if disconnect on play round and round over, and notify opponent", async () => {
    const newClient = io(webSocketUrl);

    const { roomCode, userId } = await createRoom(newClient);
    const { userId: opponentId, board } = await joinRoom(
      opponentClient,
      roomCode,
    );

    const playerWords = counter(generateRandomWords(10));
    const opponentWords = counter(generateRandomWords(15));

    await redisClient.HSET(userId, playerWords);
    await redisClient.HSET(opponentId, opponentWords);
    await sleep(100);
    opponentClient.emit("game:go_to_next_round", {
      roomCode,
      userId: opponentId,
      words: opponentWords,
      stage: 0,
    });

    newClient.disconnect();

    await sleep(500);

    await endCurrentRound(redisClient, roomCode);

    const rejoinedRoomPromise = createSocketPromise(
      newClient,
      "rejoinedRoom",
      (data) => data,
    );

    const notifyOpponentPromise = createSocketPromise(
      opponentClient,
      "opponentReconnected",
      (data) => data,
    );

    newClient.connect();
    newClient.emit("game:rejoin_room", { roomCode, userId });

    const data = await rejoinedRoomPromise;
    const opponentData = await notifyOpponentPromise;

    expect(data.board).toEqual(board);
    expect(data.words).toEqual(
      Object.keys(playerWords).map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.opponentWords).toEqual(
      Object.keys(opponentWords).map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.round).toEqual(1);
    expect(data.timeLeft).toEqual(180);

    expect(opponentData.board).toEqual(board);
    expect(opponentData.words).toEqual(
      Object.keys(opponentWords).map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(opponentData.opponentWords).toEqual(
      Object.keys(playerWords).map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.round).toEqual(1);

    newClient.close();
  });
  it("should reconnect to challenge round if disconnect on clean up round and round over", async () => {
    const newClient = io(webSocketUrl);

    const { roomCode, userId } = await createRoom(newClient);
    const { userId: opponentId, board } = await joinRoom(
      opponentClient,
      roomCode,
    );
    await sleep(200);

    const room = {
      ...(await getRoomData(redisClient, roomCode)),
      currentRound: 1,
    };

    await redisClient.HSET("rooms", roomCode, JSON.stringify(room));

    const playerWords = generateRandomWords(10);
    const opponentWords = generateRandomWords(15);

    await redisClient.HSET(`${opponentId}_challenge`, counter(playerWords));
    await sleepOpponentClient.emit("game:go_to_next_round", {
      roomCode,
      userId: opponentId,
      words: opponentWords,
      stage: 1,
    });

    newClient.disconnect();

    await sleep(500);
    await endCurrentRound(redisClient, roomCode);

    const rejoinedRoomPromise = createSocketPromise(
      newClient,
      "rejoinedRoom",
      (data) => data,
    );
    const notifyOpponentPromise = createSocketPromise(
      opponentClient,
      "opponentReconnected",
      (data) => data,
    );

    newClient.connect();
    newClient.emit("game:rejoin_room", { roomCode, userId });
    const data = await rejoinedRoomPromise;
    const opponentData = await notifyOpponentPromise;

    expect(data.board).toEqual(board);
    expect(data.words).toEqual(
      opponentWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.opponentWords).toEqual(
      playerWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.round).toEqual(2);
    expect(data.timeLeft).toEqual(180);

    expect(opponentData.board).toEqual(board);
    expect(opponentData.words).toEqual(
      playerWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(opponentData.opponentWords).toEqual(
      opponentWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.round).toEqual(2);
    newClient.close();
  });

  it("should reconnect to result round if disconnect on challenge round and round over", async () => {
    const newClient = io(webSocketUrl);

    const { roomCode, userId } = await createRoom(newClient);
    const { userId: opponentId, board } = await joinRoom(
      opponentClient,
      roomCode,
    );

    await sleep(200);

    const room = {
      ...(await getRoomData(redisClient, roomCode)),
      currentRound: 2,
    };

    await redisClient.HSET("rooms", roomCode, JSON.stringify(room));

    const playerWords = generateRandomWords(10);
    const opponentWords = generateRandomWords(15);

    await redisClient.HSET(`${opponentId}_challenge`, counter(playerWords));
    await redisClient.HSET(`${userId}_challenge`, counter(opponentWords));

    await sleepOpponentClient.emit("game:go_to_next_round", {
      roomCode,
      userId: opponentId,
      words: opponentWords,
      stage: 2,
    });

    newClient.disconnect();

    await sleep(500);
    await endCurrentRound(redisClient, roomCode);

    const rejoinedRoomPromise = createSocketPromise(
      newClient,
      "rejoinedRoom",
      (data) => data,
    );
    const notifyOpponentPromise = createSocketPromise(
      opponentClient,
      "opponentReconnected",
      (data) => data,
    );

    newClient.connect();
    newClient.emit("game:rejoin_room", { roomCode, userId });
    const data = await rejoinedRoomPromise;
    const opponentData = await notifyOpponentPromise;

    expect(data.board).toEqual(board);
    expect(data.words).toEqual(
      playerWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.opponentWords).toEqual(
      opponentWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.round).toEqual(3);
    expect(data.timeLeft).toEqual(180);

    expect(opponentData.board).toEqual(board);
    expect(opponentData.words).toEqual(
      opponentWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(opponentData.opponentWords).toEqual(
      playerWords.map((word: string) => {
        return { word, checked: true };
      }),
    );
    expect(data.round).toEqual(3);

    newClient.close();
  });
});
