import { Router } from "express";
import {
  getSummary,
  getExpensesByCategory,
  getMonthlyHistory,
  getRecentTransactions,
} from "../controllers/dashboard.controller";
import { authenticate } from "../middlewares/auth";

const dashboardRoutes = Router();

/**
 * @route GET /dashboard/summary
 * @desc Retorna o resumo financeiro do usuário autenticado
 */
dashboardRoutes.get("/summary", authenticate, getSummary);

/**
 * @route GET /dashboard/expenses-by-category
 * @desc Retorna os gastos do usuário por categoria/ autenticado
 */
dashboardRoutes.get("/expenses-by-category", authenticate, getExpensesByCategory);

/**
 * @route GET /dashboard/monthly-history
 * @desc Retorna o histórico mensal de receitas e despesas do usuário autenticado
 */
dashboardRoutes.get("/monthly-history", authenticate, getMonthlyHistory);

/**
 * @route GET /dashboard/recent-transactions
 * @desc Retorna as 10 últimas transações do usuário autenticado
 */
dashboardRoutes.get("/recent-transactions", authenticate, getRecentTransactions);

export default dashboardRoutes;
