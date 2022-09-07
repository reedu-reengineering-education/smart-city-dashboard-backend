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
import AaseeController from '../../controllers/aaseeController';

import { client } from '../../lib/redis';
import { isValidDate } from '../../utils';

const AASEE_UPDATE_INTERVAL: string = '* * * * *'; // each minute

// controller
const aasee = new AaseeController(
  `https://datahub.digital/api/device/832/parsed-packets?auth=${process.env.DATAHUB_DIGITAL_TOKEN}`,
  'aasee',
  {
    postBody: {
      variables: [
        {
          variable: 'water_temperature',
          value_type_name: '°C',
        },
        {
          variable: 'dissolved_oxygen',
          value_type_name: 'Number',
        },
        {
          variable: 'pH',
          value_type_name: 'Number',
        },
      ],
      from: '1d',
    },
    location: {
      latitude: 51.957148,
      longitude: 7.614297,
    },
  }
);

client.on('connect', () => {
  cron.schedule(AASEE_UPDATE_INTERVAL, async () => {
    await aasee.update();
  });
  aasee.update();
});

// routes
router.get('/', async (req, res) => {
  const data = await client.get('aasee');
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

  const data = await aasee.getTimeSeriesData(from);
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

export default router;
