import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterBody:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - role
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: E-mail do usuário
 *           example: user@example.com
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Senha com no mínimo 6 caracteres
 *           example: senhaSegura123
 *         role:
 *           type: string
 *           description: Nome do papel/função do usuário
 *           example: Admin
 *     RegisterResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Usuário registrado com sucesso
 *     LoginBody:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: E-mail do usuário
 *           example: user@example.com
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Senha do usuário
 *           example: senhaSegura123
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT Token válido por 24 horas
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registra um novo usuário
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterBody'
 *     responses:
 *       200:
 *         description: Usuário registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 */
export const register = async (req: Request, res: Response) => {
    const { email, password, role } = req.body

    // Validação simples
    if (!email || !password || !role) {
        res.status(400).json({ error: 'Parâmetros inválidos' })
        return
    }

    try {
        const userRole = await prisma.userRole.findUnique({
            where: { name: role }
        })

        if (!userRole) {
            res.status(400).json({ error: 'Função inválida' })
            return
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                roleId: userRole.id
            }
        })

        res.json({ message: 'Usuário registrado com sucesso' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Erro no registro' })
    }
}

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Realiza o login do usuário
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Token JWT válido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 */
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body

    // Validação simples
    if (!email || !password) {
        res.status(400).json({ error: 'Parâmetros inválidos' })
        return
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                role: true,
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    include: { plan: true }
                }
            }
        })

        if (!user || !(await bcrypt.compare(password, user.password))) {
            res.status(401).json({ error: 'Credenciais inválidas' })
            return
        }

        let plan = user.subscriptions.length > 0
            ? user.subscriptions[0].plan
            : null

        if (!plan) {
            const freePlan = await prisma.plan.findUnique({
                where: { name: 'Free' }
            })

            if (!freePlan) {
                res.status(500).json({ error: 'Nenhum plano encontrado!' })
                return
            }

            plan = freePlan
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role.name,
                plan
            },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        )

        res.json({ token })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Erro no login' })
    }
}


/**
 * @swagger
 * components:
 *   schemas:
 *     ForgotPasswordBody:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: E-mail do usuário para recuperação de senha
 *           example: user@example.com
 *     ForgotPasswordResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Link de recuperação enviado para o e-mail
 *         token:
 *           type: string
 *           description: Token JWT para reset de senha (exemplo didático)
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     ResetPasswordBody:
 *       type: object
 *       required:
 *         - token
 *         - newPassword
 *       properties:
 *         token:
 *           type: string
 *           description: Token recebido por e-mail para resetar a senha
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         newPassword:
 *           type: string
 *           minLength: 6
 *           description: Nova senha do usuário
 *           example: novaSenhaForte123
 *     ResetPasswordResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Senha atualizada com sucesso
 *     ChangePasswordBody:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: Senha atual do usuário
 *           example: senhaAntiga123
 *         newPassword:
 *           type: string
 *           minLength: 6
 *           description: Nova senha do usuário
 *           example: novaSenhaForte123
 *     ChangePasswordResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Senha alterada com sucesso
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicita redefinição de senha (envia um link/token para o e-mail)
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordBody'
 *     responses:
 *       200:
 *         description: Link de recuperação enviado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForgotPasswordResponse'
 */
export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        res.status(400).json({ error: 'Email é obrigatório' });
        return
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            res.status(404).json({ error: 'Usuário não encontrado' });
            return
        }

        const resetToken = jwt.sign(
            { id: user.id },
            process.env.JWT_RESET_SECRET!, // Um secret só para reset
            { expiresIn: '1h' }
        );

        // Aqui normalmente enviaríamos o token por e-mail.
        // Exemplo fictício:
        // await sendResetPasswordEmail(user.email, resetToken);

        res.json({ message: 'Link de recuperação enviado para o e-mail', token: resetToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro no processo de recuperação' });
    }
}

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reseta a senha usando o token recebido por e-mail
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordBody'
 *     responses:
 *       200:
 *         description: Senha resetada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResetPasswordResponse'
 */
export const resetPassword = async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
        return
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET!) as { id: string };

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: decoded.id },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Senha atualizada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Token inválido ou expirado' });
    }
}

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Altera a senha do usuário autenticado
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordBody'
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChangePasswordResponse'
 */
export const changePassword = async (req: Request, res: Response) => {
    const userId = req.user?.id; // vem do middleware de auth
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
        return
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            res.status(401).json({ error: 'Senha atual incorreta' });
            return
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao alterar senha' });
    }
}

