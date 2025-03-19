import { Router } from 'express'
import { updateUser } from '../controllers/user.controller'
import { authenticate } from '../middlewares/auth'

const UserRouter = Router()

UserRouter.put('/users/:id', authenticate, updateUser)

export default UserRouter