import { app } from './app.js';

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.info(`Snail Racing API listening on http://localhost:${port}`);
});
