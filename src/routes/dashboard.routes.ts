import { Router } from "express";
import {
  getSummary,
  getExpensesByCategory,
  getMonthlyHistory,
  getRecentTransactions,
} from "../controllers/dashboard.controller";

const dashboardRoutes = Router();

/**
 * @route GET /dashboard/summary/:userId
 * @desc Retorna o resumo financeiro do usuário
 */
dashboardRoutes.get("/summary/:userId", getSummary);

/**
 * @route GET /dashboard/expenses-by-category/:userId
 * @desc Retorna os gastos do usuário por categoria
 */
dashboardRoutes.get("/expenses-by-category/:userId", getExpensesByCategory);

/**
 * @route GET /dashboard/monthly-history/:userId
 * @desc Retorna o histórico mensal de receitas e despesas do usuário
 */
dashboardRoutes.get("/monthly-history/:userId", getMonthlyHistory);

/**
 * @route GET /dashboard/recent-transactions/:userId
 * @desc Retorna as 10 últimas transações do usuário
 */
dashboardRoutes.get("/recent-transactions/:userId", getRecentTransactions);

export default dashboardRoutes;
