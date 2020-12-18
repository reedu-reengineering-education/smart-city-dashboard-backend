import express from 'express';
import { client } from './helper/dbHelper';

import HttpController from './controllers/httpController';
import HystreetController from './controllers/hystreetController';

const PARKHAUS_UPDATE_INTERVAL: number = 60000;
const HYSTREET_UPDATE_INTERVAL: number = 3600000;

const port: number = 3000;

const app = express();

const parkhaus = new HttpController(
  'https://www.stadt-muenster.de/index.php?id=10910',
  'parkhaus'
);

const pedenstrianCountRothenburg = new HystreetController(
  'https://hystreet.com/api/locations/100',
  'pedenstrianCountRothenburg',
  {
    headers: {
      'Content-Type': 'application/vnd.hystreet.v1',
      'X-API-Token': process.env.HYSTREETS_API_TOKEN,
    },
  }
);
const pedenstrianCountLudgeristraße = new HystreetController(
  'https://hystreet.com/api/locations/117',
  'pedenstrianCountLudgeristraße',
  {
    headers: {
      'Content-Type': 'application/vnd.hystreet.v1',
      'X-API-Token': process.env.HYSTREETS_API_TOKEN,
    },
  }
);
const pedenstrianCountAlterFischmarkt = new HystreetController(
  'https://hystreet.com/api/locations/296',
  'pedenstrianCountAlterFischmarkt',
  {
    headers: {
      'Content-Type': 'application/vnd.hystreet.v1',
      'X-API-Token': process.env.HYSTREETS_API_TOKEN,
    },
  }
);

// ... init new controller here

client.on('connect', () => {
  // update our datasets in interval
  setInterval(async () => {
    await parkhaus.update();
  }, PARKHAUS_UPDATE_INTERVAL);

  setInterval(async () => {
    await pedenstrianCountRothenburg.update();
    await pedenstrianCountLudgeristraße.update();
    await pedenstrianCountAlterFischmarkt.update();
  }, HYSTREET_UPDATE_INTERVAL);

  // initial fetch when application starts
  parkhaus.update();
  pedenstrianCountRothenburg.update();
  pedenstrianCountLudgeristraße.update();
  pedenstrianCountAlterFischmarkt.update();
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

app.get('/pedestrian', async (req, res) => {
  const rothenburg: any = await client.get('pedenstrianCountRothenburg');
  const ludgeristraße: any = await client.get('pedenstrianCountLudgeristraße');
  const alterFischmarkt: any = await client.get(
    'pedenstrianCountAlterFischmarkt'
  );
  const data = [
    JSON.parse(rothenburg),
    JSON.parse(ludgeristraße),
    JSON.parse(alterFischmarkt),
  ];
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

app.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});
