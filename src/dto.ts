import { JsonValue } from "@prisma/client/runtime/client";

export interface IPlan {
    id: string;
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    price: number;
    currency: string;
    invoiceLimit: number;
    features: JsonValue;
    isActive: boolean;
}

export type IRole = "normal_user" | "company_user" | "company_collaborator" | "admin"