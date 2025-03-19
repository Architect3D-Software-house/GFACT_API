import { z } from 'zod'
import { extendZodWithOpenApi } from 'zod-openapi'

extendZodWithOpenApi(z)

// Register
export const registerBodySchema = z.object({
  email: z.string().email().openapi({
    example: 'user@example.com',
    description: 'E-mail do usuário',
  }),
  password: z.string().min(6).openapi({
    example: 'password123',
    description: 'Senha do usuário',
  }),
  role: z.string().openapi({
    example: 'user',
    description: 'Role de acesso do usuário',
  }),
}).openapi({ description: 'Dados para registro' })

export const registerResponseSchema = z.object({
  message: z.string().openapi({ example: 'Usuário registrado com sucesso' }),
  user: z.object({
    id: z.string().uuid().openapi({ example: 'uuid-gerado' }),
    email: z.string().email().openapi({ example: 'user@example.com' }),
    roleId: z.string().uuid().openapi({ example: 'role-uuid' }),
  }),
})

// Login
export const loginBodySchema = z.object({
  email: z.string().email().openapi({
    example: 'user@example.com',
    description: 'E-mail do usuário',
  }),
  password: z.string().min(6).openapi({
    example: 'password123',
    description: 'Senha do usuário',
  }),
}).openapi({ description: 'Dados para login' })

export const loginResponseSchema = z.object({
  token: z.string().openapi({
    example: 'jwt.token.aqui',
    description: 'Token JWT',
  }),
})
