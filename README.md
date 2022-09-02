This project contains the source code of the backend of the smart city dashboard. It fetches data from different sources and serves as a relay for the [frontend](https://github.com/reedu-reengineering-education/smart-city-dashboard)

### Running the project
1. Clone the repo
2. `cd smart-city-dashboard-backend`
3. `cp docker-compose.example.yml docker-compose.yml`
4. Change the env variables for the `app` services
5. `docker-compose up -d`

### Development
1. Clone the repo
2. `cd smart-city-dashboard-backend`
3. `cp docker-compose.example.yml docker-compose.yml`
4. Change the env variables for the `app` services
5. `yarn` or `npm install`
7. `docker-compose up -d redis` to run the redis db
8. `yarn start` or `npm start`

#### Technology
The backend is written in [typescript](https://www.typescriptlang.org/) and uses [express](https://expressjs.com/). For intermediate data store, we are using a [redis](https://redis.io/) DB.

#### Dev Technology
We are using typescript for type safety. In order to have consistend formatting / styling of the code, we are using [husky](https://typicode.github.io/husky/#/), [lint-staged](https://github.com/okonet/lint-staged) and [prettier](https://prettier.io/).

#### File Structure
- `src` Source code. This also includes the main entry point
    - `controllers` Controllers fetch data from different sources periodically (formats them) and stores them into the redis DB (splitted for each data source)
    - `lib` Libraries (e.g. redis client)
    - `routes` Routes of the API
    - `routes` Redux reducers (splitted for each data source)
    - `utils` Helper functions
- Docker and project related files

#### How to add a new data source
If your data source is not behind an api key, you might not need to add the data source to the backend project. You can just access it directly from the frontend. Otherwise follow these steps:
1. Create a new controller in `src/controllers` (you can extend the HTTP Controller) and implement data fetching for your data source
2. Create a new router in `src/routes` on which you want to distribute your data
3. Register your new router in `src/app.ts`