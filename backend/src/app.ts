import express from 'express';
import { snailPayRouter } from './routes/snailpayRoutes.js';

export const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use('/api/snailpay', snailPayRouter);

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});
