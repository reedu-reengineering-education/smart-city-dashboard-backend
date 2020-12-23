import express from 'express';

import { client } from './helper/dbHelper';

import HttpController from './controllers/httpController';
import HystreetController from './controllers/hystreetController';
import OpenSenseMapController from './controllers/openSenseMapController';

const PARKHAUS_UPDATE_INTERVAL: number = 60000;
const HYSTREET_UPDATE_INTERVAL: number = 3600000;
const OPENSENSEMAP_UPDATE_INTERVAL: number = 30000;

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
    latitude: 51.96064,
    longitude: 7.62598,
  },
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
    latitude: 51.957076,
    longitude: 7.626644,
  },
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
    latitude: 51.963504,
    longitude: 7.629157,
  },
  {
    headers: {
      'Content-Type': 'application/vnd.hystreet.v1',
      'X-API-Token': process.env.HYSTREETS_API_TOKEN,
    },
  }
);

const openSenseMapTemperature24 = new OpenSenseMapController(
  'https://api.opensensemap.org/boxes/5d91f4bb5f3de0001ab6bb78/data/5d91f4bb5f3de0001ab6bb7f',
  'osemTemperature24'
);

const openSenseMapHumidity24 = new OpenSenseMapController(
  'https://api.opensensemap.org/boxes/5d91f4bb5f3de0001ab6bb78/data/5d91f4bb5f3de0001ab6bb7e',
  'osemHumidity24'
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

  setInterval(async () => {
    await openSenseMapTemperature24.update();
    await openSenseMapHumidity24.update();
  }, OPENSENSEMAP_UPDATE_INTERVAL);

  // initial fetch when application starts
  parkhaus.update();
  pedenstrianCountRothenburg.update();
  pedenstrianCountLudgeristraße.update();
  pedenstrianCountAlterFischmarkt.update();

  openSenseMapTemperature24.update();
  openSenseMapHumidity24.update();
});

app.get('/', async (req, res) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.send(`
  Available Routes:
  
  GET \t/parkhaus \tParkhaus data
  GET \t/opensensemapTemperature24 \topensensemap temperature 24h moving average
  GET \t/opensensemapHumidity24 \Popensensemap humidity 24h moving average
  GET \t/pedestrian \tPassanten data
  `);
});

app.get('/parkhaus', async (req, res) => {
  const data = await client.get('parkhaus');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

app.get('/opensensemapTemperature24', async (req, res) => {
  const data = await client.get('osemTemperature24');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

app.get('/opensensemapHumidity24', async (req, res) => {
  const data = await client.get('osemHumidity24');
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
