import express from 'express';
import { client } from './helper/dbHelper';

import HttpController from './controllers/httpController';

const UPDATE_INTERVAL: number = 60000;

const port: number = 3000;

const app = express();

const parkhaus = new HttpController(
  'https://www.stadt-muenster.de/index.php?id=10910',
  'parkhaus'
);

// ... init new controller here

client.on('connect', () => {
  // update our datasets in interval
  setInterval(async () => {
    await parkhaus.update();
  }, UPDATE_INTERVAL);
});

app.get('/', async (req, res) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.send(`
  Available Routes:
  
  GET \t/parkhaus \tParkhaus data
  `);
});

app.get('/parkhaus', async (req, res) => {
  const data = await client.get('parkhaus');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

app.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});
