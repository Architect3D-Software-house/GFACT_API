import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';


const prisma = new PrismaClient
/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Endpoints para gerenciamento de categorias
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Lista todas as categorias
 *     tags: [Categories]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({ where: { deleted: false } });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar as categorias.' });
    }
};

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Busca uma categoria pelo ID
 *     tags: [Categories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Categoria não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Não encontrado
 */
export const getCategoryById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const category = await prisma.category.findFirst({ where: { id, deleted: false } });
        if (!category) {
            res.status(404).json({ error: 'Categoria não encontrada' });
            return
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar a categoria.' });
    }
};

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Cria uma nova categoria
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - colorHex
 *               - icon
 *             properties:
 *               name:
 *                 type: string
 *               colorHex:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/Category'
 */
export const createCategory = async (req: Request, res: Response) => {
    const { name, colorHex, icon } = req.body;
    if (!name || !colorHex || !icon) {
        res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        return;
    }
    if (req.user!.role !== 'admin') {
        res.status(403).json({ error: 'Você não tem permissão para criar uma categoria.' });
        return;
    }
    try {
        const category = await prisma.category.create({
            data: { name, colorHex, icon }
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar a categoria.' });
    }
};

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Atualiza uma categoria existente
 *     tags: [Categories]
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
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Categoria atualizada com sucesso
 *       404:
 *         description: Categoria não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Não encontrado
 */
export const updateCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (req.user!.role !== 'admin') {
        res.status(403).json({ error: 'Acesso não autorizado.' });
        return
    }
    try {
        const category = await prisma.category.update({
            where: { id },
            data: req.body,
        });
        res.json(category);
    } catch (error) {
        res.status(404).json({ error: 'Categoria não encontrada.' });
    }
};

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Exclui (soft delete) uma categoria
 *     tags: [Categories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Categoria excluída com sucesso
 *       404:
 *         description: Categoria não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Não encontrado
 */
export const deleteCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (req.user!.role !== 'admin') {
        res.status(403).json({ error: 'Acesso negado. Você não tem permissão para excluir categorias.' });
        return
    }
    try {
        await prisma.category.update({
            where: { id },
            data: { deleted: true, deletedAt: new Date() },
        });
        res.status(204).send();
    } catch (error) {
        res.status(404).json({ error: 'Categoria não encontrada.' });
    }
};
