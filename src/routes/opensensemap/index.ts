const express = require('express');
const router = express.Router();
import cron from 'node-cron';

import OpenSenseMapController from '../../controllers/openSenseMapController';
import { client } from '../../lib/redis';
import { isValidDate } from '../../utils';

const OPENSENSEMAP_UPDATE_INTERVAL: string = '* * * * *'; // each minute

// controller
const openSenseMapTemperature24 = new OpenSenseMapController(
  'https://api.opensensemap.org/boxes/5f7ddc9f692773001c7da31c/data/5f7ddc9f692773001c7da323',
  'osemTemperature24'
);

const openSenseMapHumidity24 = new OpenSenseMapController(
  'https://api.opensensemap.org/boxes/5f7ddc9f692773001c7da31c/data/5f7ddc9f692773001c7da322',
  'osemHumidity24'
);

router.get('/opensensemapHumidity24', async (req, res) => {
  const data = await client.get('osemHumidity24');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

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
    await openSenseMapTemperature24.getTimeSeriesData(from, to),
    await openSenseMapHumidity24.getTimeSeriesData(from, to),
  ];
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

export default router;
