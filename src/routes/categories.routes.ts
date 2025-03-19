import { Router } from 'express';

import {
  getCategories, getCategoryById, createCategory, updateCategory, deleteCategory
} from '../controllers/categories.controller';

const CategoriesRouter = Router();

// Categories
CategoriesRouter.get('/categories', getCategories);
CategoriesRouter.get('/categories/:id', getCategoryById);
CategoriesRouter.post('/categories', createCategory);
CategoriesRouter.put('/categories/:id', updateCategory);
CategoriesRouter.delete('/categories/:id', deleteCategory);

export default CategoriesRouter;
