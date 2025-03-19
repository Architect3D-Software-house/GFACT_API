// src/controllers/SubscriptionController.ts

import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

export class SubscriptionController {
    /**
     * @swagger
     * /subscriptions:
     *   get:
     *     summary: Listar todas as subscrições
     *     description: Lista todas as subscrições. Apenas administradores têm acesso.
     *     tags:
     *       - Subscriptions
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Lista de subscrições
     *       403:
     *         description: Acesso negado
     *       500:
     *         description: Erro ao buscar subscrições
     */
    static async listSubscriptions(req: Request, res: Response) {
        if (req.user?.role !== 'admin') {
            res.status(403).json({ error: 'Acesso negado' });
            return;
        }

        try {
            const subscriptions = await prisma.subscription.findMany({
                include: { user: true, plan: true },
            });
            res.json(subscriptions);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao buscar subscrições' });
        }
    }

    /**
     * @swagger
     * /subscriptions/{id}:
     *   get:
     *     summary: Obter uma subscrição específica
     *     description: Busca uma subscrição pelo ID. O usuário deve ser administrador ou dono da subscrição.
     *     tags:
     *       - Subscriptions
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: ID da subscrição
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Detalhes da subscrição
     *       403:
     *         description: Acesso negado
     *       404:
     *         description: Subscrição não encontrada
     *       500:
     *         description: Erro ao buscar subscrição
     */
    static async getSubscriptionById(req: Request, res: Response) {
        const { id } = req.params;

        if (!req.user) {
            res.status(403).json({ error: 'Acesso negado' });
            return;
        }

        try {
            const subscription = await prisma.subscription.findUnique({
                where: { id },
                include: { user: true, plan: true },
            });

            if (!subscription) {
                res.status(404).json({ error: 'Subscrição não encontrada' });
                return;
            }

            if (req.user.role !== 'admin' && subscription.userId !== req.user.id) {
                res.status(403).json({ error: 'Acesso negado' });
                return;
            }

            res.json(subscription);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao buscar subscrição' });
        }
    }

    /**
     * @swagger
     * /subscriptions:
     *   post:
     *     summary: Criar uma nova subscrição
     *     description: Cria uma nova subscrição para o usuário autenticado.
     *     tags:
     *       - Subscriptions
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               planId:
     *                 type: string
     *               paymentMethod:
     *                 type: string
     *               externalRef:
     *                 type: string
     *               endDate:
     *                 type: string
     *                 format: date-time
     *     responses:
     *       201:
     *         description: Subscrição criada com sucesso
     *       400:
     *         description: Já possui uma subscrição ativa
     *       404:
     *         description: Plano não encontrado
     *       500:
     *         description: Erro ao criar subscrição
     */
    static async createSubscription(req: Request, res: Response) {
        const { planId, paymentMethod, externalRef, endDate } = req.body;

        try {
            const existingPlan = await prisma.plan.findUnique({ where: { id: planId } });

            if (!existingPlan) {
                res.status(404).json({ error: 'Plano não encontrado' });
                return;
            }

            const activeSubscription = await prisma.subscription.findFirst({
                where: { userId: req.user!.id, status: 'ACTIVE' },
            });

            if (activeSubscription) {
                res.status(400).json({ error: 'Já possui uma subscrição ativa' });
                return;
            }

            const subscription = await prisma.subscription.create({
                data: {
                    userId: req.user!.id,
                    planId,
                    paymentMethod,
                    externalRef,
                    endDate,
                    status: 'ACTIVE',
                },
            });

            res.status(201).json(subscription);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao criar subscrição' });
        }
    }

    /**
     * @swagger
     * /subscriptions/{id}:
     *   put:
     *     summary: Atualizar uma subscrição
     *     description: Atualiza uma subscrição existente. Apenas administradores ou donos podem atualizar.
     *     tags:
     *       - Subscriptions
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: ID da subscrição
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               planId:
     *                 type: string
     *               status:
     *                 type: string
     *               endDate:
     *                 type: string
     *                 format: date-time
     *               renewsAt:
     *                 type: string
     *                 format: date-time
     *               paymentMethod:
     *                 type: string
     *     responses:
     *       200:
     *         description: Subscrição atualizada com sucesso
     *       403:
     *         description: Acesso negado
     *       404:
     *         description: Subscrição não encontrada
     *       500:
     *         description: Erro ao atualizar subscrição
     */
    static async updateSubscription(req: Request, res: Response) {
        const { id } = req.params;
        const { planId, status, endDate, renewsAt, paymentMethod } = req.body;

        try {
            const subscription = await prisma.subscription.findUnique({
                where: { id },
            });

            if (!subscription) {
                res.status(404).json({ error: 'Subscrição não encontrada' });
                return;
            }

            if (req.user?.role !== 'admin' && subscription.userId !== req.user!.id) {
                res.status(403).json({ error: 'Acesso negado' });
                return;
            }

            const updated = await prisma.subscription.update({
                where: { id },
                data: {
                    planId: planId || subscription.planId,
                    status: status || subscription.status,
                    endDate: endDate || subscription.endDate,
                    renewsAt: renewsAt || subscription.renewsAt,
                    paymentMethod: paymentMethod || subscription.paymentMethod,
                },
            });

            res.json(updated);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao atualizar subscrição' });
        }
    }

    /**
     * @swagger
     * /subscriptions/{id}:
     *   delete:
     *     summary: Cancelar uma subscrição
     *     description: Cancela uma subscrição existente. Apenas administradores ou donos podem cancelar.
     *     tags:
     *       - Subscriptions
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: ID da subscrição
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Subscrição cancelada com sucesso
     *       403:
     *         description: Acesso negado
     *       404:
     *         description: Subscrição não encontrada
     *       500:
     *         description: Erro ao cancelar subscrição
     */
    static async cancelSubscription(req: Request, res: Response) {
        const { id } = req.params;

        try {
            const subscription = await prisma.subscription.findUnique({
                where: { id },
            });

            if (!subscription) {
                res.status(404).json({ error: 'Subscrição não encontrada' });
                return;
            }

            if (req.user?.role !== 'admin' && subscription.userId !== req.user!.id) {
                res.status(403).json({ error: 'Acesso negado' });
                return;
            }

            const canceled = await prisma.subscription.update({
                where: { id },
                data: {
                    status: 'CANCELED',
                    canceledAt: new Date(),
                },
            });

            res.json({ message: 'Subscrição cancelada com sucesso', subscription: canceled });
        } catch (err) {
            res.status(500).json({ error: 'Erro ao cancelar subscrição' });
        }
    }
}
