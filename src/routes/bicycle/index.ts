/**
 * Smart City Münster Dashboard
 * Copyright (C) 2022 Reedu GmbH & Co. KG
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const express = require('express');
const router = express.Router();
import cron from 'node-cron';
import EcoCounterController from '../../controllers/ecoCounterController';

import { client } from '../../lib/redis';
import { isValidDate } from '../../utils';

const ECO_COUNTER_UPDATE_INTERVAL: string = '0 * * * *'; // everyday at 00:00

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

// after connection to redis db is established start to update data repeatedly
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
