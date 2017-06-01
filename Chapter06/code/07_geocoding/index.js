const pg = require('pg');

const dbCredentials = {
    host: 'localhost',
    port: 5434,
    user: 'postgres',
    password: 'postgres',
    database: 'mastering_postgis'
};

const customersSchema = 'etl_geocoding';
const customersTable = 'customers';
const readLimit = 10;

const gMapsApiKey = 'HERE_GOES_YOUR_API_KEY';

/**
 * a simplistic progress indicator
 */
const progressIndicator = function(){
    var p = 0;
    let chars = '|/-\\';
    return {
        next (){
            process.stdout.write(`${chars[p]}\r`);
            p++;
            if(p >= chars.length){
                p = 0;
            }
        },
        reset(){
            p = 0;
            process.stdout.write('\r');
        }
    }
}();

/**
 * reads non-geocoded customer records
 */
const readCustomers = function(){
    return new Promise((resolve, reject) => {
        console.log('Extracting customer record...');

        let client = new pg.Client(dbCredentials);

        client.connect((err) => {
            if(err){
                reject(err.message);
                return;
            }

            client.query(`SELECT * FROM ${customersSchema}.${customersTable} WHERE geocoded = false LIMIT ${readLimit};`, function(err, result){
                if(err){
                    try {
                        client.end();
                    } catch(e){}
                    reject(err.message);
                    return;
                }

                client.end();

                console.log('Done!');
                resolve(result.rows);
            });
        });
    });
}

/**
 * generates a geocoding call
 */
const generateGeocodingCall = function(gMapsClient, customer){
    return new Promise((resolve, reject) => {
         
         progressIndicator.next();
         
         let address = `${customer.street_no} ${customer.street}, ${customer.postcode}, ${customer.town}`;
         
         gMapsClient.geocode({
            address: address
        }, (err, response) => {
            if(err){
                reject(err.message);
                return;
            }

            if(response.json.error_message){
                console.log(response.json.status,  response.json.error_message);
                reject(err);
                return;
            }

            //update customer
            let geocoded = response.json.results[0];
            if(geocoded){
                customer.geocoded = true;
                customer.lon = geocoded.geometry.location.lng;
                customer.lat = geocoded.geometry.location.lat;
            }
            
            resolve();
        });
    });
}

/**
 * geocodes specified customer addresses
 */
const geocodeAddresses = function(customers){
    return new Promise((resolve, reject) => {
        console.log('Geocoding addresses...');

        let gMapsClient = require('@google/maps').createClient({
            key: gMapsApiKey
        });

        //prepare geocoding calls
        let geocodingCalls = []; 
        for(let c of customers){
            geocodingCalls.push(
                generateGeocodingCall(gMapsClient, c)
            );
        }

        //and execute them
        Promise.all(geocodingCalls)
            .then(()=>resolve(customers))
            .catch((err) => reject(err));
    });
}

/**
 * helper fn to execute a non-query
 */
const executeNonQuery = function(client, sql, params){
    return new Promise((resolve, reject) => {
        client.query(sql, params, (err, result) => {
                if(err){
                    reject(err.message);
                }
                else {
                    resolve();
                }
        });
    });
}

/**
 * saves geocoded customers back to the database
 */
const saveCustomers = function(customers){
    return new Promise((resolve, reject) => {
        
        console.log('Saving geocoded customer records...');

        let client = new pg.Client(dbCredentials);

        client.connect((err) => {
            if(err){
                reject(err.message);
                return;
            }

            const updateSQLs = [];
            var pCounter = 0;

            for(let c of customers){
                updateSQLs.push(executeNonQuery(client, `UPDATE ${customersSchema}.${customersTable} SET lon=$1,lat=$2,geocoded=true WHERE id=$3;`, [c.lon, c.lat, c.id]));
            }

            Promise.all(updateSQLs)
                .then(() => {
                    client.end();
                    resolve();
                })
                .catch((err)=>{
                    try{
                        client.end();
                    }
                    catch(e){}
                    reject(err);
                });
        });
    });
}

//chain all the stuff together
readCustomers()
    .then(geocodeAddresses)
    .then(saveCustomers)
    .catch(err => console.log(`uups, an error has occured: ${err}`));