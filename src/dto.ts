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

export type IJsonSchema = {
    "Identificacao do Emitente": {
        "Nome": string;
        "Morada": string;
        "NIF": string;
        "Contacto": string;
    };
    "Identificacao do Cliente": {
        "Nome": string;
        "NIF": string;
        "Morada": string;
    };
    "Data e Hora da Factura": {
        "Data": string;
        "Hora": string;
    };
    "Numero da Factura": {
        "Factura-recibo": string;
        "Documentos referenciados": string;
    };
    "Valor Total": string; // Ex: "KZ 500,00"
    "IVA e Base Tributavel": {
        "Base tributavel": string;
        "IVA (%)": string;
        "Valor Total com IVA": string;
    };
    "Pagamento": {
        "Forma de pagamento": string;
        "Valor": string;
    };
    "Outras Informacoes": {
        "Software": string;
        "Emp.": string;
        "Data de processamento": string;
    };
};


export type IRole = "normal_user" | "company_user" | "company_collaborator" | "admin"