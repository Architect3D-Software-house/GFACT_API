import { Request, Response } from 'express';
import { createWorker } from 'tesseract.js';
import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';
import multer from 'multer';
import { google } from 'googleapis';
import { prompt } from '../openia/prompts';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const drive = google.drive({ version: 'v3', auth: process.env.GOOGLE_API_KEY });
const prisma = new PrismaClient


export class InvoiceController {
    // 📄 POST /process-invoice
    /**
     * @swagger
     * /process-invoice:
     *   post:
     *     summary: Processa uma nova fatura
     *     tags: [Invoices]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               file:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: Fatura processada e salva com sucesso
     *         content:
     *           application/json:
 *                 schema:
 *                   type: object
 *                   $ref: '#/components/schemas/JsonSchema'
     *       400:
     *         description: Nenhum arquivo enviado
     *         content:
 *                 application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                      error:
 *                        type: string
 *                        example: Nenhum arquivo enviado
     *       401:
     *         description: Usuário não autenticado
     *         content:
 *                 application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                      error:
 *                        type: string
 *                        example: Não autorizado
     *       403:
     *         description: Limite de faturas atingido
     *         content:
 *               application/json:
 *                  schema:
 *                    type: object
 *                    properties:
 *                      error:
 *                        type: string
 *                        example: Limite de faturas atingido
     */
    static async processInvoice(req: Request, res: Response) {
        const { categoryId, typeId } = req.body
        try {
            if (!req.file) {
                res.status(400).json({ error: 'Nenhum arquivo enviado' });
                return
            }

            if (!req.user) {
                res.status(401).json({ error: 'Usuário não autenticado' });
                return
            }

            const currentInvoiceCount = await prisma.invoice.count({
                where: { userId: req.user.id },
            });

            if (req.user.plan === null) {
                res.status(403).json({
                    error: 'Faça upgrate para um plano.',
                });
                return
            }

            if (currentInvoiceCount >= req.user.plan.invoiceLimit) {
                res.status(403).json({
                    error: 'Limite de faturas atingido. Faça upgrade para continuar.',
                });
                return
            }

            const worker = await createWorker('eng');
            const { data } = await worker.recognize(req.file.path);
            await worker.terminate();

            const extractedText = data.text;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: `${prompt}. As informações que não encontrares traga apenas a chave com valor string vazio.: ${extractedText}`,
                }],
                response_format: { type: 'json_object' },
            });

            const structuredData = JSON.parse(response.choices[0].message.content || '{}');

            const category = await prisma.category.findUnique({ where: { id: categoryId } });
            const type = await prisma.type.findUnique({ where: { id: typeId } });

            if (!category) {
                res.status(400).json({ error: "categoryId invalido" })
                return
            }

            if (!type) {
                res.status(400).json({ error: "typeId invalido" })
                return
            }

            const savedData = await prisma.invoice.create({
                data: {
                    text: extractedText,
                    jsonData: structuredData,
                    userId: req.user.id,
                    categoryId: categoryId,
                    typeId: typeId,
                },
            });

            res.json(savedData);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // 📄 GET /invoices
    /**
     * @swagger
     * /invoices:
     *   get:
     *     summary: Lista as faturas do usuário autenticado
     *     tags: [Invoices]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: categoryId
     *         schema:
     *           type: string
     *       - in: query
     *         name: typeId
     *         schema:
     *           type: string
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *       - in: query
     *         name: orderBy
     *         schema:
     *           type: string
     *       - in: query
     *         name: order
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *     responses:
     *       200:
     *         description: Lista de faturas
     *         content:
 *               application/json:
 *                 schema:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invoice'
     *       401:
     *         description: Usuário não autenticado
     *         content:
 *                 application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                      error:
 *                        type: string
 *                        example: Não autorizado
     */
    static async listInvoices(req: Request, res: Response) {
        if (!req.user) {
            res.status(401).json({ error: 'Usuário não autenticado' });
            return
        }

        try {
            const {
                categoryId,
                typeId,
                search,
                startDate,
                endDate,
                page = '1',
                limit = '10',
                orderBy = 'createdAt',
                order = 'desc',
            } = req.query;

            const pageNumber = parseInt(page as string, 10);
            const limitNumber = parseInt(limit as string, 10);

            const where: any = {
                userId: req.user.id,
            };

            if (categoryId) where.categoryId = categoryId;
            if (typeId) where.typeId = typeId;
            if (search) {
                where.text = {
                    contains: search as string,
                    mode: 'insensitive',
                };
            }

            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = new Date(startDate as string);
                if (endDate) where.createdAt.lte = new Date(endDate as string);
            }

            const invoices = await prisma.invoice.findMany({
                where,
                orderBy: {
                    [orderBy as string]: order === 'asc' ? 'asc' : 'desc',
                },
                skip: (pageNumber - 1) * limitNumber,
                take: limitNumber,
                include: {
                    category: true,
                    type: true,
                },
            });

            const totalCount = await prisma.invoice.count({ where });

            res.json({
                data: invoices,
                meta: {
                    total: totalCount,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(totalCount / limitNumber),
                },
            });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar invoices' });
        }
    }

    // 📄 GET /invoices/:id
    /**
     * @swagger
     * /invoices/{id}:
     *   get:
     *     summary: Busca uma fatura específica pelo ID
     *     tags: [Invoices]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Fatura encontrada
     *         content:
 *               application/json:
 *                 schema:
 *                   type: object
 *                   $ref: '#/components/schemas/Invoice'
     *       401:
     *         description: Usuário não autenticado
     *         content:
 *                 application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                      error:
 *                        type: string
 *                        example: Não autorizado
     *       404:
     *         description: Fatura não encontrada
     *         content:
 *                 application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                      error:
 *                        type: string
 *                        example: Não encontrado
     */
    static async getInvoiceById(req: Request, res: Response) {
        if (!req.user) {
            res.status(401).json({ error: 'Usuário não autenticado' });
            return
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id },
        });

        if (!invoice || invoice.userId !== req.user.id) {
            res.status(404).json({ error: 'Fatura não encontrada' });
            return
        }

        res.json(invoice);
    }

    // 📄 GET /invoices/all
    /**
     * @swagger
     * /invoices/all:
     *   get:
     *     summary: Lista todas as faturas (admin)
     *     tags: [Invoices]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: userId
     *         schema:
     *           type: string
     *       - in: query
     *         name: categoryId
     *         schema:
     *           type: string
     *       - in: query
     *         name: typeId
     *         schema:
     *           type: string
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *       - in: query
     *         name: orderBy
     *         schema:
     *           type: string
     *       - in: query
     *         name: order
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *     responses:
     *       200:
     *         description: Lista completa de faturas
     *         content:
 *               application/json:
 *                 schema:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invoice'
     */
    static async listAllInvoices(req: Request, res: Response) {
        try {
            const {
                userId,
                categoryId,
                typeId,
                search,
                startDate,
                endDate,
                page = '1',
                limit = '10',
                orderBy = 'createdAt',
                order = 'desc',
            } = req.query;

            const pageNumber = parseInt(page as string, 10);
            const limitNumber = parseInt(limit as string, 10);

            const where: any = {};

            if (userId) where.userId = userId;
            if (categoryId) where.categoryId = categoryId;
            if (typeId) where.typeId = typeId;
            if (search) {
                where.text = {
                    contains: search as string,
                    mode: 'insensitive',
                };
            }

            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = new Date(startDate as string);
                if (endDate) where.createdAt.lte = new Date(endDate as string);
            }

            const invoices = await prisma.invoice.findMany({
                where,
                orderBy: {
                    [orderBy as string]: order === 'asc' ? 'asc' : 'desc',
                },
                skip: (pageNumber - 1) * limitNumber,
                take: limitNumber,
                include: {
                    user: true,
                    category: true,
                    type: true,
                },
            });

            const totalCount = await prisma.invoice.count({ where });

            res.json({
                data: invoices,
                meta: {
                    total: totalCount,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(totalCount / limitNumber),
                },
            });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar invoices' });
        }
    }

    // 📄 DELETE /invoices/:id
     /**
     * @swagger
     * /invoices/{id}:
     *   delete:
     *     summary: Deleta uma fatura específica
     *     tags: [Invoices]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Fatura excluída com sucesso
     *         
     *       401:
     *         description: Usuário não autenticado
     *         content:
 *                 application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                      error:
 *                        type: string
 *                        example: Não autorizado
     *       404:
     *         description: Fatura não encontrada
     *         content:
 *                 application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                      error:
 *                        type: string
 *                        example: Fatura não encontrada
     */
    static async deleteInvoice(req: Request, res: Response) {
        if (!req.user) {
            res.status(401).json({ error: 'Usuário não autenticado' });
            return
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id },
        });

        if (!invoice || invoice.userId !== req.user.id) {
            res.status(404).json({ error: 'Fatura não encontrada' });
            return
        }

        await prisma.invoice.delete({
            where: { id: req.params.id },
        });

        res.json({ message: 'Fatura excluída com sucesso' });
    }
}
