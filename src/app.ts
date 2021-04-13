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
