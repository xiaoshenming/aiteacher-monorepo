interface Room {
  id: string
  title: string
  creatorId: number
  creatorName: string
  roomKey: string
  createdAt: number
  lastActiveAt: number
  isActive: boolean
  maxMembers: number
}

interface CreateRoomOptions {
  title?: string
}

const WHITEBOARD_API = 'http://localhost:10008/api/rooms'

export function useWhiteboard() {
  const userStore = useUserStore()

  function authHeaders(): Record<string, string> {
    return userStore.token
      ? { Authorization: `Bearer ${userStore.token}` }
      : {}
  }

  async function createRoom(options?: CreateRoomOptions): Promise<Room> {
    const res = await $fetch<{ data: Room }>(WHITEBOARD_API, {
      method: 'POST',
      headers: authHeaders(),
      body: options || {},
    })
    return res.data
  }

  async function listMyRooms(): Promise<Room[]> {
    const res = await $fetch<{ data: Room[] }>(WHITEBOARD_API, {
      headers: authHeaders(),
    })
    return res.data
  }

  async function getRoom(roomId: string): Promise<Room> {
    const res = await $fetch<{ data: Room }>(`${WHITEBOARD_API}/${roomId}`, {
      headers: authHeaders(),
    })
    return res.data
  }

  async function updateRoom(roomId: string, data: Partial<{ title: string, maxMembers: number, isActive: boolean }>): Promise<Room> {
    const res = await $fetch<{ data: Room }>(`${WHITEBOARD_API}/${roomId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: data,
    })
    return res.data
  }

  async function deleteRoom(roomId: string): Promise<void> {
    await $fetch(`${WHITEBOARD_API}/${roomId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  }

  async function joinRoom(roomId: string): Promise<void> {
    await $fetch(`${WHITEBOARD_API}/${roomId}/join`, {
      method: 'POST',
      headers: authHeaders(),
    })
  }

  async function leaveRoom(roomId: string): Promise<void> {
    await $fetch(`${WHITEBOARD_API}/${roomId}/leave`, {
      method: 'POST',
      headers: authHeaders(),
    })
  }

  return {
    createRoom,
    listMyRooms,
    getRoom,
    updateRoom,
    deleteRoom,
    joinRoom,
    leaveRoom,
  }
}
