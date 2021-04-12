const express = require('express');
const router = express.Router();
import cron from 'node-cron';
import EcoCounterController from '../../controllers/ecoCounterController';

import { client } from '../../lib/redis';
import { isValidDate } from '../../utils';

const ECO_COUNTER_UPDATE_INTERVAL: string = '0 0 * * *'; // everyday at 00:00

// controller
const bicycle = new EcoCounterController(
  'https://apieco.eco-counter-tools.com/api/1.0/site',
  'bicycle',
  {
    reqConfig: {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.ECO_COUNTER_API_TOKEN}`,
      },
    },
  }
);

client.on('connect', () => {
  cron.schedule(ECO_COUNTER_UPDATE_INTERVAL, async () => {
    await bicycle.update();
  });

  bicycle.update();
});

// routes
router.get('/', async (req, res) => {
  const data = await client.get('bicycle');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

router.get('/timeseries', async (req, res) => {
  const from = new Date(req.query.from);

  // wrong date
  if (!isValidDate(from)) {
    res
      .json({
        message: 'Invalid Date.',
      })
      .status(422);
    return;
  }

  const data = await bicycle.getTimeSeriesData(from);
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

router.get('/:counterId', async (req, res) => {
  const data = await client.get(`bicycle_${req.params.counterId}`);
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

export default router;
