import { Router } from 'express'
import { getLoggedUser, getUserCategoriesWithAmounts, updateUser } from '../controllers/user.controller'
import { authenticate } from '../middlewares/auth'

const UserRouter = Router()

UserRouter.put('/users/:id', authenticate, updateUser)
UserRouter.get('/users/me', authenticate, getLoggedUser)
UserRouter.get('/users/categories/amounts', authenticate, getUserCategoriesWithAmounts)

export default UserRouter