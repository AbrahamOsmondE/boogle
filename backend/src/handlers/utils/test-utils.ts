import { faker } from "@faker-js/faker";
import { getRoomData } from "./GameHandlers-utils";
import { Room } from "../dto/GameHandlersDto";

export const createSocketPromise = <T>(
  client: any,
  listener: string,
  callback: (data: any) => T,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    client.on(listener, async (data) => {
      try {
        const promiseData = await callback(data);
        resolve(promiseData);
      } catch (e) {
        reject(e);
      }
    });
  });
};

export const createRoom = (client) => {
  const createRoomCallback = (data: PlayerData) => data;
  const promise = createSocketPromise(
    client,
    "roomCreated",
    createRoomCallback,
  );

  client.emit("game:create_room");

  return promise;
};

export const joinRoom = (client, roomCode) => {
  const joinRoomCallback = (data: PlayerData) => data;
  const promise = createSocketPromise(client, "joinedRoom", joinRoomCallback);

  client.emit("game:join_room", { roomCode });

  return promise;
};

export const sleep = async (duration: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
};

export const generateRandomWords = (count) => {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(faker.word.noun());
  }
  return words;
};

export const endCurrentRound = async (redis, roomCode) => {
  const room = await getRoomData(redis, roomCode);

  if (!room) throw new Error("room not found");

  const currentTime = new Date();

  const newRoom: Room = {
    ...room,
    roundStartTime: new Date(currentTime.getTime() - 200000),
  };
  await redis.HSET("rooms", roomCode, JSON.stringify(newRoom));
};

export interface PlayerData {
  roomCode: string;
  userId: string;
  isPlayer: boolean;
  board?: string;
  word?: string;
}
