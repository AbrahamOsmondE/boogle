import io from 'socket.io-client';
import { createClient } from "redis";
import { PlayerData, createRoom, createSocketPromise, joinRoom } from './utils/test-utils';
import { getRoomData } from './utils/GameHandlers-utils';
import { Room } from './dto/GameHandlersDto';

const webSocketUrl =
  process.env.REACT_APP_WEBSOCKET_URL || "http://localhost:8001";

const client = io(webSocketUrl);
const opponentClient = io(webSocketUrl);
const spectatorClient = io(webSocketUrl);

const redisClient = createClient()

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
    client.emit('game:cancel_room', {roomCode})

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
    const {userId:opponentId} = await joinRoom(opponentClient, roomCode)

    const word = 'BOOGLE'
    const promise = createSocketPromise(opponentClient, 'wordAppended', (data) => data) as Promise<PlayerData>
    client.emit('game:append_word', {roomCode, userId, word})
    
    const data = await promise

    const wordCount = await redisClient.HGET(userId, word)

    expect(wordCount).toEqual(1)
    expect(data.userId).toEqual(userId)
    expect(data.word).toEqual(word)
  })
})