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
