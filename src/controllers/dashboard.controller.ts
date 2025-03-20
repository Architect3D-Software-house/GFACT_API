import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { IJsonSchema } from "../dto";
import { JsonValue } from "@prisma/client/runtime/library";
const prisma = new PrismaClient();
/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Endpoints para controle do dashboard
 */

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Resumo financeiro do usuário
 *     tags: [Dashboard]
 *     description: Retorna o total de receitas, despesas e o saldo do usuário.
 *     responses:
 *       200:
 *         description: Resumo financeiro retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalIncome:
 *                   type: number
 *                 totalExpense:
 *                   type: number
 *                 balance:
 *                   type: number
 */
export const getSummary = async (req: Request, res: Response) => {
    try {
        const income = await prisma.invoice.findMany({
            where: { userId: req.user!.id, type: { name: 'Receita' } },
            select: { jsonData: true }
        });

        const totalIncome = income.reduce((sum, inv) => {
            const json = inv.jsonData as IJsonSchema;
            return sum + (Number(json.Pagamento.Valor) || 0);
        }, 0);

        const expense = await prisma.invoice.findMany({
            where: { userId: req.user!.id, type: { name: 'Despesa' } },
            select: { jsonData: true }
        });

        const totalExpense = expense.reduce((sum, inv) => {
            const json = inv.jsonData as IJsonSchema;
            return sum + (Number(json.Pagamento.Valor) || 0);
        }, 0);

        res.json({
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /dashboard/expenses-by-category:
 *   get:
 *     summary: Gastos por categoria
 *     tags: [Dashboard]
 *     description: Retorna os gastos do usuário agrupados por categoria
 *     responses:
 *       200:
 *         description: Lista de categorias com total de gastos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                   color:
 *                     type: string
 *                   total:
 *                     type: number
 */
export const getExpensesByCategory = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            where: { deleted: false },
            include: {
                invoices: {
                    where: { userId: req.user!.id, type: { name: 'Despesa' } },
                    select: { jsonData: true }
                }
            }
        });

        const result = categories.map(cat => ({
            category: cat.name,
            color: cat.colorHex,
            total: cat.invoices.reduce((sum, inv) => {
                const json = inv.jsonData as IJsonSchema;
                return sum + (Number(json.Pagamento.Valor) || 0);
            }, 0)
        })).filter(c => c.total > 0);

        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /dashboard/monthly-history:
 *   get:
 *     summary: Histórico mensal
 *     tags: [Dashboard]
 *     description: Retorna a evolução mensal de receitas e despesas
 *     responses:
 *       200:
 *         description: Histórico mensal retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   month:
 *                     type: string
 *                   income:
 *                     type: number
 *                   expense:
 *                     type: number
 */
export const getMonthlyHistory = async (req: Request, res: Response) => {
    try {
        const invoices = await prisma.invoice.findMany({
            where: { userId: req.user!.id },
            select: { jsonData: true, createdAt: true, type: true }
        });

        const history: { [key: string]: { income: number, expense: number } } = {};

        invoices.forEach(({ jsonData, createdAt, type }) => {
            const json = jsonData as IJsonSchema;
            const month = createdAt.toISOString().slice(0, 7); // YYYY-MM
            if (!history[month]) history[month] = { income: 0, expense: 0 };
            if (type.name === 'Receita') history[month].income += Number(json.Pagamento.Valor);
            if (type.name === 'Despesa') history[month].expense += Number(json.Pagamento.Valor);
        });

        const result = Object.entries(history).map(([month, values]) => ({
            month,
            ...values
        }));

        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /dashboard/recent-transactions:
 *   get:
 *     summary: Últimas transações
 *     tags: [Dashboard]
 *     description: Retorna as 10 últimas transações do usuário
 *     responses:
 *       200:
 *         description: Lista das últimas transações
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                  $ref: '#/components/schemas/Invoice'
 */
export const getRecentTransactions = async (req: Request, res: Response) => {
    try {
        const transactions = await prisma.invoice.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { category: true, type: true }
        });

        res.json(transactions);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
