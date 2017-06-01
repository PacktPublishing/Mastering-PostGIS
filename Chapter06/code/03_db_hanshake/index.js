const pg = require('pg');

//init client with the appropriate conn details
const client = new pg.Client({
    host: 'localhost',
    port: 5434,
    user: 1010,
    password: 1010,
    database: 'mastering_postgis'
});


//connect to the db
client.connect(function(err){
    if(err){
        console.warn('Error connecting to the database: ', err.message);
        throw err;
    }

    //once connected we can now interact with a db
    client.query('SELECT PostGIS_full_version() as postgis_version;', function(err, result){
        if(err){
            console.warn('Error obtaining PostGIS version: ', err.message);
            throw err;
        }

        //there should be one row present provided PostGIS is installed. If not, executing query would throw.
        console.warn(result.rows[0].postgis_version);

        //close the connection when done
        client.end(function(err){
            if(err){
                console.warn('Error disconnecting: ', err.message);
                throw err;
            }
        });
    });
});




