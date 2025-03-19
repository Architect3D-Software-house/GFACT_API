import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import fs from 'fs';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gfact API',
      version: '1.0.0',
      description: 'API de gerenciamento de subscrições do Gfact',
    },
    servers: [
      {
        url: 'http://localhost:4002/api',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [], // 🔒 Aplicado por padrão (mas pode ser removido por rota)
      },
    ],
  },
  apis: ['./src/controllers/*.ts', './src/docs/swagger.yaml'], // ⚠️ Garanta que as rotas públicas removam o security no controller
};

const swaggerSpec = swaggerJSDoc(options);
fs.writeFileSync('./swagger.json', JSON.stringify(swaggerSpec, null, 2));

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
