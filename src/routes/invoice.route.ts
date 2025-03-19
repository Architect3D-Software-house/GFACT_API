import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import multer from 'multer';
import { authenticate } from '../middlewares/auth';
const upload = multer({ dest: 'uploads/' });

const InvoiceRouter = Router();

/**
 * @route POST /process-invoice
 * @desc Processa o upload da fatura, extrai o texto e salva no banco de dados.
 */
InvoiceRouter.post(
  '/process-invoice',
  authenticate,
  upload.single('file'),
  InvoiceController.processInvoice
);

/**
 * @route GET /invoices
 * @desc Lista as faturas do usuário autenticado com filtros.
 */
InvoiceRouter.get('/invoices', authenticate, InvoiceController.listInvoices);

/**
 * @route GET /invoices/:id
 * @desc Busca uma fatura específica pelo ID (usuário autenticado).
 */
InvoiceRouter.get('/invoices/:id', authenticate, InvoiceController.getInvoiceById);

/**
 * @route GET /invoices/all
 * @desc Lista todas as faturas (admin), com filtros avançados.
 */
InvoiceRouter.get('/invoices/all', authenticate, InvoiceController.listAllInvoices);

/**
 * @route DELETE /invoices/:id
 * @desc Exclui uma fatura pelo ID (usuário autenticado).
 */
InvoiceRouter.delete('/invoices/:id', authenticate, InvoiceController.deleteInvoice);

export default InvoiceRouter;
