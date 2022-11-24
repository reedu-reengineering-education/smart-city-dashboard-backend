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

import express from 'express';
import cors from 'cors';

import openSenseMapRouter from './routes/opensensemap';
import parkingRouter from './routes/parking';
import pedestrianRouter from './routes/pedestrian';
import aaseeRouter from './routes/aasee';
import bicycleRouter from './routes/bicycle';

const port: number = +process.env.PORT || 3000;

const app = express();

if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
}

// the index route which gives information about the available routes
app.get('/', async (req, res) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.send(`
  Available Routes:

  GET \t/parking \t\t\tParkhaus data
  GET \t/opensensemap/timeseries \tmoving average timeseries data
  GET \t/pedestrian \t\t\tPassanten data
  GET \t/aasee \t\t\t\tAasee data
  GET \t/bicycle \t\t\tBicycle data
  GET \t/bicycle/:stationId \t\tBicycle data (last 7 days) of specific station
  `);
});

app.use('/opensensemap', openSenseMapRouter);
app.use('/parking', parkingRouter);
app.use('/pedestrian', pedestrianRouter);
app.use('/aasee', aaseeRouter);
app.use('/bicycle', bicycleRouter);

app.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});
