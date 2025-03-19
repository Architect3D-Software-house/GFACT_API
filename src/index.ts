import express from 'express';
import dotenv from 'dotenv';
import './types/express/index'
import AuthRouter from './routes/auth.routes';
import UserRouter from './routes/user.routes';
import SubscriptionRouter from './routes/subscriptions.routes';
import InvoiceRouter from './routes/invoice.route';
import { setupSwagger } from './docs/swagger';
import PlansRouter from './routes/plans.routes';
import CategoriesRouter from './routes/categories.routes';
import dashboardRoutes from './routes/dashboard.routes';
import path from 'path';

dotenv.config();


const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Middleware de autenticação

app.use("/api", AuthRouter)
app.use("/api", UserRouter)
app.use("/api", SubscriptionRouter)
app.use("/api", InvoiceRouter)
app.use("/api", PlansRouter)
app.use("/api", CategoriesRouter)
app.use("/api", dashboardRoutes)
app.get('/swagger.json', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../swagger.json'));
});
// Expondo o JSON do OpenAPI em /api-docs-json
// Setup do Swagger
setupSwagger(app);

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log(`Documentação Swagger disponível em http://localhost:${port}/api-docs`);
});