import { createClient } from "redis";
import { generateBoard, generateRoomCode, generateWordChecklist } from "./GameHandlers-utils";
import {faker} from '@faker-js/faker'

const redisClient = createClient()

const generateRandomWords = (count) => {
  const words:string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(faker.word.noun());
  }
  return words;
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
    redisClient.quit()
  })

  it('should generate room code of length 6', () => {
    const roomCode = generateRoomCode()

    expect(roomCode.length).toEqual(6)
  })

  it('should generate a random board of length 16', () => {
    const board = generateBoard()

    expect(board.length).toEqual(16)
  })

  it('should create word check list', async () => {
    const userId = 'mockUserId'
    const wordList = generateRandomWords(faker.number.int({min:5, max: 15}))

    Promise.all(wordList.map(async (word) => redisClient.HINCRBY(userId, word, 1)))

    const wordCheckList = await generateWordChecklist(redisClient, userId)

    wordCheckList.forEach((wordCheck) => {
      expect(wordList).toContain(wordCheck.word)
      expect(wordCheck.checked).toEqual(true)
    })
  })

  it('should create a false word check list', async () => {
    const userId = 'mockUserId'
    const wordList = generateRandomWords(faker.number.int({min:5, max: 15}))
    const word = wordList[0]

    Promise.all(wordList.map(async (word) => redisClient.HINCRBY(userId, word, 1)))
    await redisClient.HINCRBY(userId, word, -1)
    const wordCheckList = await generateWordChecklist(redisClient, userId)

    const checkOfWord = wordCheckList.find(wordCheck=>wordCheck.word === word)

    expect(checkOfWord?.checked).toEqual(false)
  })
})