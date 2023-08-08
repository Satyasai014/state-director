const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const databasePath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDatabase = async (request, response) => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Database initialized");
    });
  } catch (e) {
    console.log(`error ${e}`);
  }
};
initializeDatabase();

const state = (s) => {
  return {
    stateId: s.state_id,
    stateName: s.state_name,
    population: s.population,
  };
};

app.get("/states/", async (request, response) => {
  const sqlQueryForStates = `
    SELECT
      *
    FROM
    state;`;
  const query = await db.all(sqlQueryForStates);
  response.send(query.map((e) => state(e)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const sqlQueryForSpecificState = `
    SELECT
      *
    FROM
    state
    WHERE
    state_id = ${stateId};`;
  const states = await db.get(sqlQueryForSpecificState);
  response.send(state(states));
});

app.post("/districts/", async (request, response) => {
  const bodyDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = bodyDetails;
  const sqlQueryForPost = `
  INSERT INTO
  district (district_name,state_id,cases,cured,active,deaths)
  VALUES
  (
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths});`;
  const responseForPost = await db.run(sqlQueryForPost);
  response.send("District Successfully Added");
});

const distri = (i) => {
  return {
    districtId: i.district_id,
    districtName: i.district_name,
    stateId: i.state_id,
    cases: i.cases,
    cured: i.cured,
    active: i.active,
    deaths: i.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getOneDistrictQuery = `
    SELECT
      *
    FROM
    district
    WHERE
    district_id = ${districtId};`;
  const database = await db.get(getOneDistrictQuery);
  response.send(distri(database));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE FROM
    district
    WHERE
    district_id = ${districtId};`;
  const dv = await db.run(deleteQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const id = request.params;
  const { districtName, stateId, cases, active, deaths } = request.body;
  const query = `
  UPDATE
  district
  SET
  district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases},
  active = ${active},
  deaths = ${deaths};`;
  const updation = await db.run(query);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  console.log(stateId);
  const query = `
  SELECT
   SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
  FROM
  district
  WHERE 
  state_id=${stateId};`;
  const details = await db.get(query);
  response.send(details);
});
const s = (dd) => {
  return {
    stateName: dd.state_name,
  };
};

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const query = `
  SELECT
    state.state_name
  FROM
  state
  INNER JOIN
  district 
  ON state.state_id=district.state_id
  WHERE
  district_id = ${districtId};`;
  const k = await db.get(query);
  response.send(s(k));
});

module.exports = app;
