import express from 'express';
import cors from 'cors';

// reprojecting parkhaus data
// @ts-ignore
import { toWgs84 } from 'reproject';
var epsg = require('epsg');

import { client } from './helper/dbHelper';

import HttpController from './controllers/httpController';
import HystreetController from './controllers/hystreetController';
import OpenSenseMapController from './controllers/openSenseMapController';

const PARKHAUS_UPDATE_INTERVAL: number = 60000;
const HYSTREET_UPDATE_INTERVAL: number = 3600000;
const OPENSENSEMAP_UPDATE_INTERVAL: number = 30000;

const port: number = 3000;

const app = express();

if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
}

const parkhaus = new HttpController(
  'https://www.stadt-muenster.de/index.php?id=10910',
  'parkhaus',
  {
    formatter: (data) => {
      return toWgs84(
        data,
        '+proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7 +units=m +no_defs',
        epsg
      );
    },
  }
);

const pedenstrianCountRothenburg = new HystreetController(
  'https://hystreet.com/api/locations/100',
  'pedenstrianCountRothenburg',
  {
    location: {
      latitude: 51.96092,
      longitude: 7.626948,
    },
    reqConfig: {
      headers: {
        'Content-Type': 'application/vnd.hystreet.v1',
        'X-API-Token': process.env.HYSTREETS_API_TOKEN,
      },
    },
  }
);
const pedenstrianCountLudgeristraße = new HystreetController(
  'https://hystreet.com/api/locations/117',
  'pedenstrianCountLudgeristraße',
  {
    location: {
      latitude: 51.960353,
      longitude: 7.627721,
    },
    reqConfig: {
      headers: {
        'Content-Type': 'application/vnd.hystreet.v1',
        'X-API-Token': process.env.HYSTREETS_API_TOKEN,
      },
    },
  }
);
const pedenstrianCountAlterFischmarkt = new HystreetController(
  'https://hystreet.com/api/locations/296',
  'pedenstrianCountAlterFischmarkt',
  {
    location: {
      latitude: 51.963543,
      longitude: 7.629283,
    },
    reqConfig: {
      headers: {
        'Content-Type': 'application/vnd.hystreet.v1',
        'X-API-Token': process.env.HYSTREETS_API_TOKEN,
      },
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

const aasee = new HttpController(
  'https://datahub.digital/api/device/832/packets?auth=D3C9FBF4-C2F2-4AE1-9D5C-056B4119B1DD',
  'aasee',
  {
    location: {
      latitude: 51.957148,
      longitude: 7.614297,
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

  setInterval(async () => {
    await openSenseMapTemperature24.update();
    await openSenseMapHumidity24.update();
    await aasee.update();
  }, OPENSENSEMAP_UPDATE_INTERVAL);

  // initial fetch when application starts
  parkhaus.update();
  pedenstrianCountRothenburg.update();
  pedenstrianCountLudgeristraße.update();
  pedenstrianCountAlterFischmarkt.update();

  openSenseMapTemperature24.update();
  openSenseMapHumidity24.update();

  aasee.update();
});

app.get('/', async (req, res) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.send(`
  Available Routes:

  GET \t/parkhaus \t\t\tParkhaus data
  GET \t/opensensemapTemperature24 \topensensemap temperature 24h moving average
  GET \t/opensensemapHumidity24 \topensensemap humidity 24h moving average
  GET \t/pedestrian \t\t\tPassanten data
  GET \t/aasee \t\t\t\tAasee data
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

app.get('/aasee', async (req, res) => {
  const data = await client.get('aasee');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

app.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});
