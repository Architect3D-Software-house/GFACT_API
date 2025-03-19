// src/routes/subscriptionRoutes.ts

import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticate } from '../middlewares/auth';

const SubscriptionRouter = Router();

/**
 * @route   GET /subscriptions
 * @desc    Listar todas as subscrições (Apenas admin)
 * @access  Admin
 */
SubscriptionRouter.get('/subscriptions', authenticate, SubscriptionController.listSubscriptions);

/**
 * @route   GET /subscriptions/:id
 * @desc    Obter uma subscrição específica (Por ID)
 * @access  Admin ou Usuário dono da subscrição
 */
SubscriptionRouter.get('/subscriptions/:id', authenticate, SubscriptionController.getSubscriptionById);

/**
 * @route   POST /subscriptions
 * @desc    Criar uma nova subscrição
 * @access  Usuário autenticado
 * @body    { planId, paymentMethod, externalRef, endDate }
 */
SubscriptionRouter.post('/subscriptions', authenticate, SubscriptionController.createSubscription);

/**
 * @route   PUT /subscriptions/:id
 * @desc    Atualizar uma subscrição (renovar, mudar plano, etc.)
 * @access  Admin ou Usuário dono da subscrição
 * @body    { planId, status, endDate, renewsAt, paymentMethod }
 */
SubscriptionRouter.put('/subscriptions/:id', authenticate, SubscriptionController.updateSubscription);

/**
 * @route   DELETE /subscriptions/:id
 * @desc    Cancelar uma subscrição (soft delete)
 * @access  Admin ou Usuário dono da subscrição
 */
SubscriptionRouter.delete('/subscriptions/:id', authenticate, SubscriptionController.cancelSubscription);

export default SubscriptionRouter;
