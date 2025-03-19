import { Response, Request } from 'express'
import { PrismaClient } from '@prisma/client'
import { IJsonSchema } from '../dto'

const prisma = new PrismaClient()

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Atualiza informações do usuário autenticado
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do usuário
 *                 example: João Silva
 *               image:
 *                 type: string
 *                 description: URL da imagem de perfil
 *                 example: https://example.com/imagem.png
 *               description:
 *                 type: string
 *                 description: Descrição do usuário
 *                 example: Desenvolvedor full stack
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuário atualizado com sucesso
 *                 user: 
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Acesso negado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Acesso negado
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Usuário não encontrado
 *       500:
 *         description: Erro ao atualizar usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Erro ao atualizar usuário
 */
export const updateUser = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(403).json({ error: 'Acesso negado' })
    return
  }

  const userId = req.params.id

  if (req.user.id !== userId) {
    res.status(403).json({ error: 'Acesso negado' })
    return
  }

  const { name, image, description } = req.body

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    })

    if (!existingUser) {
      res.status(404).json({ error: 'Usuário não encontrado' })
      return
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, image, description },
    })

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao atualizar usuário' })
  }
}

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Retorna os dados do usuário autenticado
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 image:
 *                   type: string
 *                 description:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Não autorizado
 */
export const getLoggedUser = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Não autorizado' })
    return
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    })

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' })
      return
    }

    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar o usuário' })
  }
}
/**
 * @swagger
 * /users/categories/amounts:
 *   get:
 *     summary: Lista as categorias com o total de gastos de um usuário específico, incluindo a data da última fatura e o último método de pagamento
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Lista de categorias com os totais do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     description: ID da categoria
 *                   name:
 *                     type: string
 *                     description: Nome da categoria
 *                   colorHex:
 *                     type: string
 *                     description: Cor da categoria
 *                   icon:
 *                     type: string
 *                     description: Ícone da categoria
 *                   amount:
 *                     type: number
 *                     description: Total gasto na categoria pelo usuário
 *                   lastInvoiceCreatedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     description: Data da última fatura da categoria
 *                   lastPaymentMethod:
 *                     type: string
 *                     nullable: true
 *                     description: Última forma de pagamento utilizada
 *       500:
 *         description: Erro ao buscar categorias do usuário
 */
export const getUserCategoriesWithAmounts = async (req: Request, res: Response) => {

  try {
    const categories = await prisma.category.findMany({
      where: {
        deleted: false,
      },
      select: {
        id: true,
        name: true,
        colorHex: true,
        icon: true,
        invoices: {
          where: {
            userId: req.user!.id,
          },
          select: {
            jsonData: true,
            createdAt: true,
          },
        },
      },
    });

    const result = categories.map((category) => {
      let amount = 0;
      let lastInvoiceCreatedAt: Date | null = null;
      let lastPaymentMethod = null;

      category.invoices.forEach((invoice) => {
        const jsonData = invoice.jsonData as IJsonSchema;

        // Extrai o valor total e converte de "KZ 500,00" para número
        const valorTotal = Number(
          jsonData["Valor Total"].replace(/[^\d,]/g, '').replace(',', '.')
        );
        if (!isNaN(valorTotal)) amount += valorTotal;

        // Pega a última data e forma de pagamento
        if (!lastInvoiceCreatedAt || new Date(invoice.createdAt) > new Date(lastInvoiceCreatedAt)) {
          lastInvoiceCreatedAt = invoice.createdAt;
          lastPaymentMethod = jsonData.Pagamento['Forma de pagamento'] || null;
        }
      });

      return {
        id: category.id,
        name: category.name,
        colorHex: category.colorHex,
        icon: category.icon,
        amount,
        lastInvoiceCreatedAt,
        lastPaymentMethod,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar categorias do usuário' });
  }
};


