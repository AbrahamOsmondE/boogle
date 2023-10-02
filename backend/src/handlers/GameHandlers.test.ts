import io from 'socket.io-client';
import { createClient } from "redis";
import { PlayerData, createRoom, createSocketPromise, generateRandomWords, joinRoom, sleep } from './utils/test-utils';
import { counter, getRoomData } from './utils/GameHandlers-utils';
import { Room } from './dto/GameHandlersDto';

const webSocketUrl =
  process.env.REACT_APP_WEBSOCKET_URL || "http://localhost:8001";

const client = io(webSocketUrl);
const opponentClient = io(webSocketUrl);
const spectatorClient = io(webSocketUrl);

const redisClient = createClient()
const sleepClient = {
  emit: async (keyword, data) => {
    client.emit(keyword, data)
    await sleep(200)
  }
}
const sleepOpponentClient = {
  emit: async (keyword, data) => {
    opponentClient.emit(keyword, data)
    await sleep(200)
  }
}

describe('test game handler', () => {
  beforeAll(async () => {
    redisClient.on("error", (err) => console.log("Redis Client Error", err));

    await redisClient.connect();
  })

  beforeEach(async () => {
    await redisClient.flushAll();
  })

  afterAll(() => {
    client.close();
    opponentClient.close();
    spectatorClient.close();
    redisClient.quit();
  })

  it('should create a new room', async () => {
    const { roomCode, userId, isPlayer } = await createRoom(client)
  
    expect(roomCode).toBeDefined();
    expect(userId).toBeDefined();
    expect(isPlayer).toEqual(true);

    const room = await getRoomData(redisClient, roomCode) as Room

    expect(room.board).toBeDefined();
    expect(room.board.length).toEqual(16);
    expect(room.currentRound).toEqual(-1);
    expect(room.players[0].id).toEqual(client.id)

  })

  it('should cancel room creation', async () => {
    const { roomCode } = await createRoom(client)

    const cancelRoomPromise = createSocketPromise(client, 'roomCanceled', (data) => data)
    await sleepClient.emit('game:cancel_room', {roomCode})

    await cancelRoomPromise

    const room = await getRoomData(redisClient, roomCode) as Room
    expect(room).toBeUndefined();
  })

  it('should join and initialize game succesfully', async () => {
    const { roomCode } = await createRoom(client)
    const initializeNextRoundPromise = createSocketPromise(client, 'initializeNextRound', (data) => data) as Promise<Room>
    const { roomCode:roomCodeOpponent, userId, isPlayer, board } = await joinRoom(opponentClient, roomCode)
    const room = await getRoomData(redisClient, roomCode) as Room
    const playerOneData = await initializeNextRoundPromise

    expect(roomCodeOpponent).toEqual(roomCode)
    expect(userId).toEqual(opponentClient.id)
    expect(isPlayer).toEqual(true)
    expect(board).toEqual(room.board)
    expect(board).toEqual(playerOneData.board)

  })

  it('should not join a non existing room', async () => {
    await createRoom(client)

    const roomNotFoundPromise = createSocketPromise(opponentClient, 'roomNotFound', (data) => data)

    joinRoom(opponentClient, 'mockRoomCode')

    const data = await roomNotFoundPromise

    expect(data).toBeUndefined()
  })

  it('should not join a full room', async () => {
    const {roomCode} = await createRoom(client)

    await joinRoom(opponentClient, roomCode)

    const fullRoomPromise = createSocketPromise(spectatorClient, 'fullRoom', (data) => data)

    joinRoom(spectatorClient, roomCode)
    const data = await fullRoomPromise

    expect(data.isPlayer).toEqual(false)
  })

  it('should append word', async () => {
    const {roomCode, userId} = await createRoom(client)
    await joinRoom(opponentClient, roomCode)

    const word = 'BOOGLE'
    const promise = createSocketPromise(opponentClient, 'wordAppended', (data) => data) as Promise<PlayerData>
    await sleepClient.emit('game:append_word', {roomCode, userId, word})
    
    const data = await promise

    const wordCount = await redisClient.HGET(userId, word)

    expect(wordCount).toEqual("1")
    expect(data.userId).toEqual(userId)
    expect(data.word).toEqual(word)
  })

  it('should update word status', async () => {
    const {roomCode, userId} = await createRoom(client)
    await joinRoom(opponentClient, roomCode)

    const word = 'BOOGLE'
    await redisClient.HINCRBY(userId, word, 1)

    await sleepClient.emit('game:update_word_status', {word, status:false, key:userId})

    const newCount = await redisClient.HGET(userId, word)
    await sleepClient.emit('game:update_word_status', {word, status:true, key:userId})

    const newNewCount = await redisClient.HGET(userId, word)

    expect(newCount).toEqual("0")
    expect(newNewCount).toEqual("1")
  })

  it('should set solutions', async () => {
    await sleepClient.emit('game:solution', {solution:[{word:'test',checked:true}], roomCode:'testroom'})

    const solutionJson = await redisClient.HGET("solutions", 'testroom')
    const solution = JSON.parse(solutionJson!)

    expect(solutionJson).toBeDefined()
    expect(solution[0].word).toEqual('test')
    expect(solution[0].checked).toEqual(true)
  })

  it('should proceed to clean up round with idempotency', async () => {
    const { roomCode, userId } = await createRoom(client)
    const { userId:opponentId } = await joinRoom(opponentClient, roomCode)

    const playerWords = generateRandomWords(10)
    const opponentWords = generateRandomWords(15)

    sleepClient.emit('game:next_round', {userId, roomCode, words:playerWords, stage: 0})
    await sleepOpponentClient.emit('game:next_round', {userId: opponentId, roomCode, words:opponentWords, stage:0})

    const cachedPlayerWords = await redisClient.HGETALL(userId)
    const cachedOpponentWords = await redisClient.HGETALL(opponentId)

    expect(counter(playerWords)).toEqual(counter(cachedPlayerWords))
    expect(counter(opponentWords)).toEqual(counter(cachedOpponentWords))

    const newRoundRoomJson = await redisClient.HGET('rooms', roomCode)
    const newRoundRoom = JSON.parse(newRoundRoomJson!)

    expect(newRoundRoom.currentRound).toEqual(1)
  })

  it('should proceed to challenge round', async () => {
    const { roomCode, userId } = await createRoom(client)
    const { userId:opponentId } = await joinRoom(opponentClient, roomCode)

    const playerWords = generateRandomWords(10)
    const opponentWords = generateRandomWords(15)

    const playerChallengeRoundPromise = createSocketPromise(client, 'challengeRound', (data) => data)
    const opponentChallengeRoundPromise = createSocketPromise(opponentClient, 'challengeRound', (data) => data)

    await sleepClient.emit('game:next_round', {userId, roomCode, words:playerWords, stage: 1})
    await sleepOpponentClient.emit('game:next_round', {userId: opponentId, roomCode, words:opponentWords, stage:1})

    const newRoundRoomJson = await redisClient.HGET('rooms', roomCode)
    const newRoundRoom = JSON.parse(newRoundRoomJson!)

    const [{words:playerReceivedChallengeRoundWords}, {words:opponentReceivedChallengeRoundWords}] = await Promise.all([playerChallengeRoundPromise, opponentChallengeRoundPromise])

    expect(newRoundRoom.currentRound).toEqual(2)
    expect(playerReceivedChallengeRoundWords).toEqual(opponentWords.map((word:string) => {return {word,checked:true}}))
    expect(opponentReceivedChallengeRoundWords).toEqual(playerWords.map((word:string) => {return {word,checked:true}}))
  })

  it('should proceed to result round and close room', async () => {
    const { roomCode, userId } = await createRoom(client)
    const { userId:opponentId } = await joinRoom(opponentClient, roomCode)

    await redisClient.HSET("solutions", roomCode, '["word"]')
    const playerWords = generateRandomWords(10)
    const opponentWords = generateRandomWords(15)

    const playerResultRoundPromise = createSocketPromise(client, 'resultRound', (data) => data)
    const opponentResultRoundPromise = createSocketPromise(opponentClient, 'resultRound', (data) => data)

    sleepClient.emit('game:next_round', {userId, roomCode, words:opponentWords, stage: 2})
    await sleepOpponentClient.emit('game:next_round', {userId: opponentId, roomCode, words:playerWords, stage:2})
    
    await sleep(500)

    const newRoundRoomJson = await redisClient.HGET('rooms', roomCode)

    const [{playerWordList:playerReceivedWords, solution}, {playerWordList:opponentReceivedWords}] = await Promise.all([playerResultRoundPromise, opponentResultRoundPromise])

    expect(newRoundRoomJson).toEqual(null)
    expect(solution).toEqual(['word'])
    expect(playerReceivedWords).toEqual(playerWords.map((word:string) => {return {word,checked:true}}))
    expect(opponentReceivedWords).toEqual(opponentWords.map((word:string) => {return {word,checked:true}}))
  })
})