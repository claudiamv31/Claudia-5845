import { once } from 'node:events';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

describe('GET /api/health', () => {
  it('reports that the API is available', async () => {
    const server = app.listen(0);
    await once(server, 'listening');

    const response = await request(server).get('/api/health');
    server.close();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
