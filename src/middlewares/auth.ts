import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { IRole } from '../dto';


const prisma = new PrismaClient

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Acesso negado' });
        return
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: {
                role: true,
                subscriptions: {
                    where: {
                        status: "ACTIVE",
                    },
                    include: {
                        plan: true
                    }
                }
            }
        });

        if (!user) {
            res.status(401).json({ error: 'Usuário não encontrado' });
            return
        }

        const plan = user.subscriptions.length === 0 ? null:user.subscriptions[0].plan

        req.user = { id: user.id, role: user.role.name as IRole, plan  };
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token inválido' });
    }
};
