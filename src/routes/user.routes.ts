import { Router } from 'express'
import { getLoggedUser, updateUser } from '../controllers/user.controller'
import { authenticate } from '../middlewares/auth'

const UserRouter = Router()

UserRouter.put('/users/:id', authenticate, updateUser)
UserRouter.get('/users/me', authenticate, getLoggedUser)

export default UserRouter