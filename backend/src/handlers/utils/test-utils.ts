export const createSocketPromise = <T>(
  client:any, 
  listener:string, 
  callback: (data: any) => T
):Promise<T> => {
  return new Promise((resolve, reject) => {
    client.on(listener, async (data) => {
      try {
        const promiseData = await callback(data)
        resolve(promiseData)
      }
      catch (e) {
        reject(e)
      }
    })
  })
}

export const createRoom = (client) => {
  const createRoomCallback = (data:PlayerData) => data
  const promise = createSocketPromise(client, 'roomCreated', createRoomCallback)

  client.emit('game:create_room')

  return promise
}

export const joinRoom = (client, roomCode) => {
  const joinRoomCallback = (data: PlayerData) => data
  const promise = createSocketPromise(client, 'joinedRoom', joinRoomCallback)

  client.emit('game:join_room', { roomCode })

  return promise
}

export interface PlayerData {
  roomCode: string;
  userId: string;
  isPlayer: boolean;
  board?: string;
  word?: string;
}
