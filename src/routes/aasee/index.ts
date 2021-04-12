const express = require('express');
const router = express.Router();
import cron from 'node-cron';
import HttpController from '../../controllers/httpController';

import { client } from '../../lib/redis';

const AASEE_UPDATE_INTERVAL: string = '* * * * *'; // each minute

// controller
const aasee = new HttpController(
  'https://datahub.digital/api/device/832/packets?auth=D3C9FBF4-C2F2-4AE1-9D5C-056B4119B1DD',
  'aasee',
  {
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

export default router;
