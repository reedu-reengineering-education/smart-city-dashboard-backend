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
const pedenstrianCountSalzstraße = new HystreetController(
  'https://hystreet.com/api/locations/310',
  'pedenstrianCountSalzstraße',
  {
    location: {
      latitude: 51.962038,
      longitude: 7.630421,
    },
    reqConfig: {
      headers: {
        'Content-Type': 'application/vnd.hystreet.v1',
        'X-API-Token': process.env.HYSTREETS_API_TOKEN,
      },
    },
  }
);

const controllers = [
  pedenstrianCountRothenburg,
  pedenstrianCountLudgeristraße,
  pedenstrianCountAlterFischmarkt,
  pedenstrianCountSalzstraße,
];

// after connection to redis db is established start to update data repeatedly
client.on('connect', () => {
  cron.schedule(HYSTREET_UPDATE_INTERVAL, () => {
    controllers.forEach((c) => c.update());
  });

  controllers.forEach((c) => c.update());
});

// routes
router.get('/', async (req, res) => {
  const rothenburg: any = await client.get('pedenstrianCountRothenburg');
  const ludgeristraße: any = await client.get('pedenstrianCountLudgeristraße');
  const alterFischmarkt: any = await client.get(
    'pedenstrianCountAlterFischmarkt'
  );
  const salzstraße: any = await client.get('pedenstrianCountSalzstraße');
  const data = [
    JSON.parse(rothenburg),
    JSON.parse(ludgeristraße),
    JSON.parse(alterFischmarkt),
    JSON.parse(salzstraße),
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

  const data = await Promise.all(
    controllers.map(async (c) =>
      JSON.parse(await c.getTimeSeriesData(from, to))
    )
  );

  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

export default router;
