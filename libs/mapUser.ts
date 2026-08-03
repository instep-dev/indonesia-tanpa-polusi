import type { User } from '@prisma/client'
import type { UserDto } from '@/services/auth/auth.dto'

export const mapUser = (user: User): UserDto => ({
  id: user.id,
  email: user.email,
  name: user.name,
  approvedAt: user.approvedAt ? user.approvedAt.toISOString() : null,
  createdAt: user.createdAt.toISOString(),
})
