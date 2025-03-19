import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function RolesSeeder() {
    const roles = [
        { name: 'normal_user' },
        { name: 'company_user' },
        { name: 'company_collaborator' },
        { name: 'admin' },
    ];

    for (const role of roles) {
        const existing = await prisma.userRole.findUnique({
            where: { name: role.name },
        });

        if (!existing) {
            await prisma.userRole.create({
                data: {
                    name: role.name,
                },
            });
            console.log(`UserRole "${role.name}" criada!`);
        } else {
            console.log(`UserRole "${role.name}" já existe. Pulando...`);
        }
    }
}

async function PlansSeeder() {
    console.log('🌱 Seeding Plans...')

    const plans = [
        {
            name: 'Free',
            description: 'Plano gratuito com funcionalidades básicas',
            price: 0,
            currency: 'AOA',
            invoiceLimit: 50,
            features: JSON.stringify([
                '50 faturas incluídas',
                'Sem suporte prioritário',
                'Armazenamento básico'
            ]),
        },
        {
            name: 'Premium',
            description: 'Plano premium para usuários avançados',
            price: 14990, // 14.990 AOA (ajuste conforme a tua regra de preço)
            currency: 'AOA',
            invoiceLimit: 500,
            features: JSON.stringify([
                '500 faturas incluídas',
                'Suporte prioritário',
                'Exportação para PDF',
                'Integração com API básica'
            ]),
        },
        {
            name: 'Pro',
            description: 'Plano Pro com recursos completos para empresas',
            price: 49990, // 49.990 AOA
            currency: 'AOA',
            invoiceLimit: 5000,
            features: JSON.stringify([
                '5000 faturas incluídas',
                'Suporte VIP 24/7',
                'Exportação para PDF/Excel',
                'Integração API avançada',
                'Multiusuário (equipe)',
                'Armazenamento ilimitado'
            ]),
        },
    ]

    for (const plan of plans) {
        const exists = await prisma.plan.findUnique({
            where: { name: plan.name },
        })

        if (!exists) {
            await prisma.plan.create({ data: plan })
            console.log(`✅ Plano "${plan.name}" criado!`)
        } else {
            console.log(`⚠️ Plano "${plan.name}" já existe, pulando...`)
        }
    }

    console.log('🎉 Seeding concluído!')
}

async function CategoriesSeeder() {
    const categories = [
        {
            name: 'Transferência',
            icon: 'credit-card',
            colorHex: '#4A90E2',
        },
        {
            name: 'Depósito',
            icon: 'money-check',
            colorHex: '#50E3C2',
        },
        {
            name: 'Utilitários',
            icon: 'bolt',
            colorHex: '#F5A623',
        },
        {
            name: 'Moradia',
            icon: 'home',
            colorHex: '#D0021B',
        },
        {
            name: 'Alimentação',
            icon: 'utensils',
            colorHex: '#BD10E0',
        },
        {
            name: 'Assinatura',
            icon: 'tv',
            colorHex: '#7ED321',
        },
        {
            name: 'Saúde',
            icon: 'dumbbell',
            colorHex: '#417505',
        },
        {
            name: 'Mobilidade',
            icon: 'bus',
            colorHex: '#F8E71C',
        },
    ];

    for (const category of categories) {
        const existing = await prisma.category.findUnique({
            where: { name: category.name },
        });

        if (!existing) {
            await prisma.category.create({
                data: {
                    name: category.name,
                    icon: category.icon,
                    colorHex: category.colorHex,
                },
            });
            console.log(`Categoria "${category.name}" criada!`);
        } else {
            console.log(`Categoria "${category.name}" já existe. Pulando...`);
        }
    }
}

PlansSeeder()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

RolesSeeder()
    .then(() => {
        console.log('Seeder de Roles finalizado!');
        prisma.$disconnect();
    })
    .catch((error) => {
        console.error('Erro no seeder de Role:', error);
        prisma.$disconnect();
        process.exit(1);
    });

CategoriesSeeder().then(() => {
    console.log('Seeder de Categories finalizado!');
    prisma.$disconnect();
})
    .catch((error) => {
        console.error('Erro no seeder de Categories:', error);
        prisma.$disconnect();
        process.exit(1);
    });
