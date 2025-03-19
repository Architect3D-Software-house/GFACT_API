import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { IJsonSchema } from "../dto";
import { JsonValue } from "@prisma/client/runtime/library";
const prisma = new PrismaClient();

/**
 * @swagger
 * /dashboard/summary/{userId}:
 *   get:
 *     summary: Resumo financeiro do usuário
 *     description: Retorna o total de receitas, despesas e o saldo do usuário.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
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
    const { userId } = req.params;
    try {
        const income = await prisma.invoice.findMany({
            where: { userId, type: { name: 'Receita' } },
            select: { jsonData: true }
        });

        const totalIncome = income.reduce((sum, inv) => {
            const json = inv.jsonData as IJsonSchema;
            return sum + (Number(json.Pagamento.Valor) || 0);
        }, 0);

        const expense = await prisma.invoice.findMany({
            where: { userId, type: { name: 'Despesa' } },
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
 * /dashboard/expenses-by-category/{userId}:
 *   get:
 *     summary: Gastos por categoria
 *     description: Retorna os gastos do usuário agrupados por categoria
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
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
    const { userId } = req.params;
    try {
        const categories = await prisma.category.findMany({
            where: { deleted: false },
            include: {
                invoices: {
                    where: { userId, type: { name: 'Despesa' } },
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
 * /dashboard/monthly-history/{userId}:
 *   get:
 *     summary: Histórico mensal
 *     description: Retorna a evolução mensal de receitas e despesas
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
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
    const { userId } = req.params;
    try {
        const invoices = await prisma.invoice.findMany({
            where: { userId },
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
 * /dashboard/recent-transactions/{userId}:
 *   get:
 *     summary: Últimas transações
 *     description: Retorna as 10 últimas transações do usuário
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Lista das últimas transações
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   text:
 *                     type: string
 *                   amount:
 *                     type: string
 *                   category:
 *                     type: string
 *                   type:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date-time
 */
export const getRecentTransactions = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const getSchema = (data: JsonValue) => data as IJsonSchema;
    try {
        const transactions = await prisma.invoice.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { category: true, type: true }
        });

        const result = transactions.map(tx => ({
            text: tx.text,
            amount: getSchema(tx.jsonData).Pagamento.Valor,
            category: tx.category.name,
            type: tx.type.name,
            date: tx.createdAt
        }));

        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
