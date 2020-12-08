import express from 'express';
import asyncRedis from 'async-redis';
import axios from 'axios';

const port: number = 3000;

const app = express();

const isProduction =
  process.env.NODE_ENV !== undefined && process.env.NODE_ENV === 'production';

const client = asyncRedis.createClient({
  host: isProduction ? 'redis' : '127.0.0.1',
});

client.on('error', (error) => {
  console.error(error);
});

client.on('connect', async () => {
  const parkhausReq = await axios.get(
    'https://www.stadt-muenster.de/index.php?id=10910'
  );
  const parkhausData = await parkhausReq.data;
  await client.set('parkhaus', JSON.stringify(parkhausData));
});

app.get('/', async (req, res) => {
  const data = await client.get('parkhaus');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

app.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});
