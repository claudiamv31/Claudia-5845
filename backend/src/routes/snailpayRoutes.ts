import { Router } from 'express';
import { charge } from '../services/snailpayService.js';

export const snailPayRouter = Router();

snailPayRouter.post('/charge', async (request, response) => {
  const result = await charge(request.body);

  response.status(result.httpStatus).json(result.body);
});
