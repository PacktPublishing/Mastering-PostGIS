const pg = require("pg");
const express = require('express');
const app = express();

const bodyParser = require('body-parser');

// configure app to use bodyParser() so we can get data from POST & PUT
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const dbCredentials = {
    host: 'localhost',
    port: 5434,
    user: 'postgres',
    password: 'postgres',
    database: 'mastering_postgis'
};

//express server
const server = app.listen(8082, () => {
  console.log(`WebGIS pgRouter server listening at http://${server.address().address}:${server.address().port}`);
});

/**
 * enable CORS
 */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
  next();
});


//prefix all the routes with 'pgroutingapi'
let router = express.Router();
app.use('/pgroutingapi', router);

/**
 * errorneus response sending helper
 */
const sendErrorResponse = (res, msg) => {
    res.statusCode = 500;
    res.end(msg);
}

/**
 * GET - snaps a coord to network nodes
 */
router.route('/snaptonetwork').get((req, res) => {

    //init client with the appropriate conn details
    let client = new pg.Client(dbCredentials);
   
    client.connect((err) => {
        if(err){
            sendErrorResponse(res, 'Error connecting to the database: ' + err.message);
            return;
        }
        
        let query = 
`SELECT
    id, lon, lat
FROM
    pgr.ways_vertices_pgr
ORDER BY
    ST_Distance(
        ST_GeomFromText('POINT(' || $1 || ' ' || $2 ||' )',4326),
        the_geom
    )
LIMIT 1;`;

        //once connected we can now interact with a db
        client.query(query, [req.query.lon, req.query.lat], (err, result) =>{
            
            //close the connection when done
            client.end();
            
            if(err){
                sendErrorResponse(res, 'Error snapping node: ' + err.message);
                return;
            }
            
            res.statusCode = 200;
            
            res.json({
                query: query,
                node: result.rows[0]
            });
        });
    });
});

/**
 * GET - calculates route
 */
router.route('/calculateroute').get((req, res) => {

    //init client with the appropriate conn details
    let client = new pg.Client(dbCredentials);
   
    client.connect((err) => {
        if(err){
            sendErrorResponse(res, 'Error connecting to the database: ' + err.message);
            return;
        }
        
        let query = 
`select 
    ST_AsText(
        ST_LineMerge(
            ST_Union(ways.the_geom)
        )
    ) as wkt
from
    (
        select
            *
        from
            pgr_dijkstra(
                'select gid as id, source, target, length_m as cost from pgr.ways',
                $1::int4, $2::int4
            )
    ) as route
    left outer join pgr.ways ways on ways.gid = route.edge;`;

        //once connected we can now interact with a db
        client.query(query, [req.query.source, req.query.target], (err, result) =>{
            
            //close the connection when done
            client.end();
            
            if(err){
                sendErrorResponse(res, 'Error calculating route: ' + err.message);
                return;
            }
            
            res.statusCode = 200;
            
            res.json({
                query: query,
                wkt: result.rows[0].wkt
            });
        });
    });
});

/**
 * GET - calculates route
 */
router.route('/calculatedtz').get((req, res) => {

    //init client with the appropriate conn details
    let client = new pg.Client(dbCredentials);
   
    client.connect((err) => {
        if(err){
            sendErrorResponse(res, 'Error connecting to the database: ' + err.message);
            return;
        }
        
        let query = 
`select ST_AsText(
    pgr_pointsAsPolygon(
        'select
            v.id::int4, v.lon::float8 as x, v.lat::float8 as y
        from(
            select * from pgr_drivingDistance(''''select gid as id, source, target, cost_s as cost from pgr.ways'''', ' || $1 || ',' || $2 || ')
        ) as dd
        left outer join pgr.ways_vertices_pgr v on dd.node = v.id'
    )
) as wkt;`;

        //once connected we can now interact with a db
        client.query(query, [req.query.source, req.query.timeSpan], (err, result) =>{
            
            //close the connection when done
            client.end();
            
            if(err){
                sendErrorResponse(res, 'Error calculating drive time zone: ' + err.message);
                return;
            }
            
            res.statusCode = 200;
            
            res.json({
                query: query,
                wkt: result.rows[0].wkt
            });
        });
    });
});