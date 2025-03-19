import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
const prisma = new PrismaClient
/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: Endpoints para gerenciamento de planos
 */

/**
 * @swagger
 * /plans:
 *   get:
 *     summary: Lista todos os planos disponíveis
 *     tags: [Plans]
 *     responses:
 *       200:
 *         description: Lista de planos retornada com sucesso
 *         content:
 *            application/json:
 *               schema:
 *                  type: array
 *                  items:
 *                    $ref: '#/components/schemas/Plan'
 */
export const getPlans = async (req: Request, res: Response) => {
    try {
        const plans = await prisma.plan.findMany();
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar os planos.' });
    }
};

/**
 * @swagger
 * /plans/{id}:
 *   get:
 *     summary: Busca um plano pelo ID
 *     tags: [Plans]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plano encontrado
 *         content:
 *            application/json:
 *               schema:
 *                  type: object
 *                  $ref: '#/components/schemas/Plan'
 *       404:
 *         description: Plano não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Plano não encontrado
 */
export const getPlanById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const plan = await prisma.plan.findUnique({ where: { id } });
        if (!plan) {
            res.status(404).json({ error: 'Plano não encontrado' });
            return
        }
        res.json(plan);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar o plano.' });
    }
};

/**
 * @swagger
 * /plans:
 *   post:
 *     summary: Cria um novo plano
 *     tags: [Plans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - invoiceLimit
 *               - features
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               invoiceLimit:
 *                 type: integer
 *               features:
 *                 type: object
 *     responses:
 *       201:
 *         description: Plano criado com sucesso
 *         content:
 *            application/json:
 *               schema:
 *                  type: object
 *                  $ref: '#/components/schemas/Plan'
 *       403:
 *          description: Acesso Negado
 *          content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Não autorizado
 *       500:
 *         description: Erro inesperado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Não autorizado
 */
export const createPlan = async (req: Request, res: Response) => {
    const { name, description, price, currency = 'AOA', invoiceLimit, features } = req.body;
    if (!name || !description || !price || !invoiceLimit || !features) {
        res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        return;
    }
    if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Ação não permitida.' });
        return;
    }
    try {
        const plan = await prisma.plan.create({
            data: {
                name,
                description,
                price,
                currency,
                invoiceLimit,
                features
            }
        });
        res.status(201).json(plan);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar o plano.' });
    }
};

/**
 * @swagger
 * /plans/{id}:
 *   put:
 *     summary: Atualiza um plano existente
 *     tags: [Plans]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             $ref: '#/components/schemas/Plan'
 *     responses:
 *       200:
 *         description: Plano atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/Plan'
 *       404:
 *         description: Plano não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Não encontrado
 *       403:
 *          description: Acesso Negado
 *          content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Não autorizado
 *       500:
 *         description: Erro inesperado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Não autorizado
 */
export const updatePlan = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Ação não permitida.' });
        return;
    }
    try {
        const plan = await prisma.plan.update({
            where: { id },
            data: req.body,
        });
        res.json(plan);
    } catch (error) {
        res.status(404).json({ error: 'Plano não encontrado.' });
    }
};

/**
 * @swagger
 * /plans/{id}:
 *   delete:
 *     summary: Exclui um plano
 *     tags: [Plans]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Plano excluído com sucesso
 *       404:
 *         description: Plano não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Não encontrado
 *       403:
 *          description: Acesso Negado
 *          content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Não autorizado
 *       500:
 *         description: Erro inesperado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Não autorizado
 */
export const deletePlan = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Ação não permitida.' });
        return;
    }
    try {
        await prisma.plan.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(404).json({ error: 'Plano não encontrado.' });
    }
};
