const express = require('express');
const router = express.Router();
import cron from 'node-cron';
import HystreetController from '../../controllers/hystreetController';

import { client } from '../../lib/redis';
import { isValidDate } from '../../utils';

const HYSTREET_UPDATE_INTERVAL: string = '*/10 * * * *'; // all 10 minutes

// controller
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

client.on('connect', () => {
  cron.schedule(HYSTREET_UPDATE_INTERVAL, () => {
    pedenstrianCountRothenburg.update();
    pedenstrianCountLudgeristraße.update();
    pedenstrianCountAlterFischmarkt.update();
  });

  pedenstrianCountRothenburg.update();
  pedenstrianCountLudgeristraße.update();
  pedenstrianCountAlterFischmarkt.update();
});

// routes
router.get('/', async (req, res) => {
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

/**
 * @description returns timeseries data of all predestrian counters
 */
router.get('/timeseries', async (req, res) => {
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);

  // wrong date
  if (!isValidDate(from) || !isValidDate(to)) {
    res
      .json({
        message: 'Invalid Date.',
      })
      .status(422);
    return;
  }

  const data = [
    JSON.parse(await pedenstrianCountRothenburg.getTimeSeriesData(from, to)),
    JSON.parse(await pedenstrianCountLudgeristraße.getTimeSeriesData(from, to)),
    JSON.parse(
      await pedenstrianCountAlterFischmarkt.getTimeSeriesData(from, to)
    ),
  ];
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

export default router;
