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
  console.log(`WebGIS crud server listening at http://${server.address().address}:${server.address().port}`);
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


//prefix all the routes with 'webgisapi'
let router = express.Router();
app.use('/webgisapi', router);

/**
 * errorneus response sending helper
 */
const sendErrorResponse = (res, msg) => {
    res.statusCode = 500;
    res.end(msg);
}

/**
 * GET - will read the features
 */
router.route('/features').get((req, res) => {

    //init client with the appropriate conn details
    let client = new pg.Client(dbCredentials);
   
    client.connect((err) => {
        if(err){
            sendErrorResponse(res, 'Error connecting to the database: ' + err.message);
            return;
        }
        
        //once connected we can now interact with a db
        client.query('SELECT id, ST_AsText(geom) as wkt FROM webgis.crud;', (err, result) =>{
            //close the connection when done
            client.end();
            
            if(err){
                sendErrorResponse(res, 'Error reading features: ' + err.message);
                return;
            }
            
            if(result.rows.length === 0){
                res.statusCode = 404;
            }
            else {
                res.statusCode = 200;
            }
            
            res.json(result.rows);
        });
    });
});

/**
 * POST - create feature handler
 */
router.route('/features').post((req, res) => {
    //init client with the appropriate conn details
    let client = new pg.Client(dbCredentials);
   
    client.connect((err) => {
        if(err){
            sendErrorResponse(res, 'Error connecting to the database: ' + err.message);
            return;
        }
        
        //extract wkt off the request
        let wkt = req.body.wkt;

        //once connected we can now interact with a db
        client.query('INSERT INTO webgis.crud (geom) values (ST_GeomFromText($1, 4326)) RETURNING id;',[wkt], (err, result) => {
            //close the connection when done
            client.end();
            
            if(err){
                sendErrorResponse(res, 'Error reading features: ' + err.message);
                return;
            }
            
            res.statusCode = 200;
            res.json({id: result.rows[0].id, wkt: wkt});
        });
    });
});

/**
 * PUT - update feature handler
 */
router.route('/features/:feature_id').put((req, res) => {
    //init client with the appropriate conn details
    let client = new pg.Client(dbCredentials);
   
    client.connect((err) => {
        if(err){
            sendErrorResponse(res, 'Error connecting to the database: ' + err.message);
            return;
        }
        
        //extract wkt off the request and id off the params
        let wkt = req.body.wkt;
        let id = req.params.feature_id;

        //once connected we can now interact with a db
        client.query('UPDATE webgis.crud set geom = ST_GeomFromText($1, 4326) where id = $2;',[wkt, id], (err, result) => {
            //close the connection when done
            client.end();
            
            if(err){
                sendErrorResponse(res, 'Error reading features: ' + err.message);
                return;
            }
            
            res.statusCode = 200;
            res.json({id: id, wkt: wkt});
        });
    });
});

/**
 * DELETE
 */
router.route('/features/:feature_id').delete((req, res) => {
    //init client with the appropriate conn details
    let client = new pg.Client(dbCredentials);
   
    client.connect((err) => {
        if(err){
            sendErrorResponse(res, 'Error connecting to the database: ' + err.message);
            return;
        }
        
        //extract id off the params
        let id = req.params.feature_id;

        //once connected we can now interact with a db
        client.query('DELETE FROM webgis.crud where id = $1;',[id], (err, result) => {
            //close the connection when done
            client.end();
            
            if(err){
                sendErrorResponse(res, 'Error reading features: ' + err.message);
                return;
            }
            
            res.statusCode = 200;
            res.json({id: id});
        });
    });
});

/**
 * POST - buffer feature handler; note using post here as wkt may be too large for GET param 
 */
router.route('/features/buffers').post((req, res) => {
    //init client with the appropriate conn details
    let client = new pg.Client(dbCredentials);
   
    client.connect((err) => {
        if(err){
            sendErrorResponse(res, 'Error connecting to the database: ' + err.message);
            return;
        }
        
        //extract wkt off the request
        let wkt = req.body.wkt;
        let buffer = req.body.buffer;

        //once connected we can now interact with a db
        client.query('SELECT ST_AsText(ST_Buffer(ST_GeomFromText($1, 4326), $2)) as buffer;',[wkt, buffer], (err, result) => {
            //close the connection when done
            client.end();
            
            if(err){
                sendErrorResponse(res, 'Error reading features: ' + err.message);
                return;
            }
            
            res.statusCode = 200;
            res.end(result.rows[0].buffer);
        });
    });
});