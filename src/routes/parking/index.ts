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
