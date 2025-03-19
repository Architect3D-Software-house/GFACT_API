import { Router } from 'express'
import { changePassword, forgotPassword, login, register, resetPassword } from '../controllers/auth.controller'

const AuthRouter = Router()

AuthRouter.post('/auth/register', register)
AuthRouter.post('/auth/login', login)
AuthRouter.post('/auth/forgot-password', forgotPassword)
AuthRouter.post('/auth/reset-password', resetPassword)
AuthRouter.post('/auth/change-password', changePassword)

export default AuthRouter
