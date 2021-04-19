const express = require('express');
const router = express.Router();
import cron from 'node-cron';

import { client } from '../../lib/redis';

// reprojecting parkhaus data
// @ts-ignore
import { toWgs84 } from 'reproject';
import { isValidDate } from '../../utils';
import ParkingController from '../../controllers/parkingController';
var epsg = require('epsg');

const PARKHAUS_UPDATE_INTERVAL: string = '*/5 * * * *'; // all 5 minutes

// controller
const parkhaus = new ParkingController(
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

client.on('connect', () => {
  cron.schedule(PARKHAUS_UPDATE_INTERVAL, async () => {
    await parkhaus.update();
  });

  parkhaus.update();
});

// routes
router.get('/', async (req, res) => {
  const data = await client.get('parkhaus');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

/**
 * @description returns timeseries data of all parking stations
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
  const data = await parkhaus.getTimeSeriesData(from, to);

  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

export default router;
