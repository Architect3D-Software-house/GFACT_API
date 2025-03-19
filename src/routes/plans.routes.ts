import { Router } from 'express';
import {
  getPlans, getPlanById, createPlan, updatePlan, deletePlan
} from '../controllers/plans.controller'

const PlansRouter = Router();

// Plans
PlansRouter.get('/plans', getPlans);
PlansRouter.get('/plans/:id', getPlanById);
PlansRouter.post('/plans', createPlan);
PlansRouter.put('/plans/:id', updatePlan);
PlansRouter.delete('/plans/:id', deletePlan);

export default PlansRouter;
