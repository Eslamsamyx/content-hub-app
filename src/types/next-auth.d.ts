import { UserRole } from '@prisma/client'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      creativeRole: string | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    creativeRole: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    creativeRole: string | null
  }
}