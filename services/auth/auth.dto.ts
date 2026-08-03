export type UserDto = {
  id: string
  email: string
  name: string | null
  approvedAt: string | null
  createdAt: string
}

export type LoginBody = {
  email: string
  password: string
}

export type RegisterBody = {
  email: string
  password: string
  name?: string
}

export type AuthResponse = {
  accessToken: string
  user: UserDto
}
