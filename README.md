This project contains the source code of the backend of the smart city dashboard. It fetches data from different sources and serves as a relay for the [frontend](https://github.com/reedu-reengineering-education/smart-city-dashboard).

### Running the project
1. Clone the repo
2. `cd smart-city-dashboard-backend`
3. `cp docker-compose.example.yml docker-compose.yml`
4. Change the env variables for the `app` services
    - These are 3 different API tokens:
    - HYSTREETS_API_TOKEN: [hystreet](https://hystreet.com/) provides pedestrian data
    - ECO_COUNTER_API_TOKEN: [eco counter](https://www.eco-counter.com/) provides bicycle data
    - DATAHUB_DIGITAL_TOKEN: [datahub](https://datahub.digital/#/) provides aasee data
5. `docker-compose up -d`

### Development

The same as "Running the Project" but instead of steps 5 do the following:

5. `yarn` or `npm install`
6. `docker-compose up -d redis` to run the redis db
7. `yarn start` or `npm start`

#### Technology
The backend is written in [typescript](https://www.typescriptlang.org/) and uses [express](https://expressjs.com/). For intermediate data store, we are using a [redis](https://redis.io/) DB.

#### Dev Technology
We are using typescript for type safety. In order to have consistend formatting / styling of the code, we are using [husky](https://typicode.github.io/husky/#/), [lint-staged](https://github.com/okonet/lint-staged) and [prettier](https://prettier.io/).

#### File Structure
- `src` Source code. This also includes the main entry point
    - `controllers` Controllers fetch data from different sources periodically (format them) and store them into the redis DB (splitted for each data source)
    - `lib` Libraries (e.g. redis client)
    - `routes` Routes of the API
        - There a a route for each data source (aasee, bicycle, opensensemap, parking, pedestrian)
        - Each route implements one controller depending on the data source
    - `utils` Helper functions
- Docker and project related files

#### How to add a new data source
If your data source is not behind an api key, you might not need to add the data source to the backend project. You can just access it directly from the frontend. Here you can find more information: https://github.com/reedu-reengineering-education/smart-city-dashboard#how-to-add-a-new-data-source

Otherwise follow these steps:
1. Create a new controller in `src/controllers` (you can extend the HTTP Controller) and implement data fetching for your data source
2. Create a new router in `src/routes` on which you want to distribute your data
3. Register your new router in `src/app.ts`

#### Add license header to file

After creating a new file in the `src` directory, please run the `license-header` script to prepend a comment with license information to the file. You can simply run

```sh
yarn license-header # or npm run license-header
```

which automatically updates the file

#### License

Copyright (C) 2022 Reedu GmbH & Co. KG

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
