const fs = require('fs');
const http = require('http');
const path = require('path');
const zlib = require('zlib');
const lineReader = require('line-by-line');
const pg = require('pg');



const downloadUrl = 'http://bulk.openweathermap.org/sample/hourly_14.json.gz';
const downloadDir = 'F:/mastering_postgis/chapter07';
const fileName = 'hourly_14.json.gz';

const dbCredentials = {
    host: 'localhost',
    port: 5434,
    user: 'postgres',
    password: 'postgres',
    database: 'mastering_postgis'
};
const schemaName = 'weather_alerts';
const tblAdm = 'gminy';
const tblWeatherPoints = 'weather_points';
const tblWeatherForecasts = 'weather_forecasts';

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
 * downloads a file
 */
const download = function(url, destination){
    return new Promise((resolve, reject) => {
        
        console.log(`Downloading ${url} to ${destination}...`);
    
        let file = fs.createWriteStream(destination);
        let request = http.get(url, function(response){
            response.on('data', (chunk)=>{ progressIndicator.next() });
            response.pipe(file);
            file.on('finish', () => {
                progressIndicator.reset();
                console.log("File downloaded!");
                file.close();
                resolve(destination);
            });
        }).on('error', (err)=>{
            fs.unlink(destination);
            reject(err.message);
        });
    }); 
}

/**
 * gunzips a specified file to the same directory
 */
const gunzipFile = function(zipFile){
    return new Promise((resolve, reject) => {
        console.log(`Unzipping '${zipFile}'...`);

        const gunzip = zlib.createGunzip();
        const writeFs = fs.createWriteStream(zipFile.replace('.gz', ''));
        
        //Note: the archive is unzipped to the directory it resides in
        fs.createReadStream(zipFile)
            .pipe(gunzip)
            .on('data', (chunk)=>{ progressIndicator.next(); })
            //when ready return file name, so can use it to load a file to the db...
            .on('end', ()=>{
                progressIndicator.reset();
                console.log('Unzipped!');
                resolve(zipFile.replace('.gz', ''));
            })
            .on('error', (err) => {
                reject(err.message);
            })
            .pipe(writeFs);
    });
}

/**
 * reads weather forecast json line by line
 */
const readJson = function(jsonFile){
    return new Promise((resolve, reject) => {
        console.log(`Reading JSON data from ${jsonFile}...`);
        
        let recCount = 0;
        let data = [];

        //use the line reader to read the data
        let lr = new lineReader(jsonFile);

        lr.on('error', function (err) {
            reject(err.message);
        });

        lr.on('line', function (line) {

            recCount ++;

            //we're spinning through over 10k recs, so updating progress every 100 seems a good choice
            if(recCount % 100 === 0){
                progressIndicator.next();
            }

            //parse string to json
            var json = JSON.parse(line);

            //and extract only records for Poland
            if(json.city.country === 'PL'){
                data.push(json);
            }
        });

        lr.on('end', function () {
            console.log(`Extracted ${data.length} records out of ${recCount}.`)
            progressIndicator.reset();
            resolve(data);
        });
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
 * loads weather forecast data to database
 */
const loadData = function(data){
    return new Promise((resolve, reject) => {
        console.log('Loading data to database...');

        let client = new pg.Client(dbCredentials);

        client.connect((err) => {
            if(err){
                reject(err.message);
                return;
            }

            //prepare querries
            let querries = [];

            let tableSetup = executeNonQuery(client, `DROP TABLE IF EXISTS ${schemaName}.${tblWeatherPoints};
            DROP TABLE IF EXISTS ${schemaName}.${tblWeatherForecasts};
            CREATE TABLE ${schemaName}.${tblWeatherPoints} (id serial NOT NULL, station_id numeric, name character varying, geom geometry);
            CREATE TABLE ${schemaName}.${tblWeatherForecasts} (id serial NOT NULL, station_id numeric, dt numeric, dt_txt character varying(19), wind_speed numeric);
            `);

            querries.push(tableSetup);

            for(let d of data){
                //weather forecast point
                querries.push(
                    executeNonQuery(
                        client,
                        `INSERT INTO  ${schemaName}.${tblWeatherPoints} (station_id, name, geom) VALUES($1,$2, ST_Transform(ST_SetSRID(ST_Point($3, $4), 4326),2180))`,
                        [d.city.id, d.city.name, d.city.coord.lon, d.city.coord.lat]
                    )
                );

                //weather forecasts
                let forecasts = [];
                let params = [];
                let pCnt = 0;
                for(let f of d.data){
                    forecasts.push(`SELECT $${++pCnt}::numeric, $${++pCnt}::numeric, $${++pCnt}, $${++pCnt}::numeric`);
                    params.push(d.city.id, f.dt, f.dt_txt, (f.wind || {}) .speed || null);
                }

                querries.push(
                    executeNonQuery(
                        client,
                        `INSERT INTO ${schemaName}.${tblWeatherForecasts} (station_id, dt, dt_txt, wind_speed) ${forecasts.join(' UNION ALL ')}`,
                        params
                    )
                );
            }

            Promise.all(querries)
                .then(()=> {
                    client.end();
                    resolve();
                })
                .catch(err=>{
                    try{
                        client.end();
                    }
                    catch(e){}
                    reject(typeof err === 'string' ? err : err.message);
                });
        });      

    });
}

/**
 * generates wind alerts 
 */
const generateAlerts = function(){
    return new Promise((resolve, reject) => {
        console.log('Generating alerts...');

        let client = new pg.Client(dbCredentials);

        client.connect((err) => {
            if(err){
                reject(err.message);
                return;
            }

            let query = `
select
	f.*,
	adm.*
from
	(select
		distinct on (station_id)
		station_id,
		dt,
		dt_txt,
		wind_speed
	from
		${schemaName}.${tblWeatherForecasts}
	where
		wind_speed > 10.8
	order by
		station_id, dt
	) as f
	
	left join (select
		distinct on (adm_id)
			g.jpt_kod_je as adm_id, g.jpt_nazwa_ as adm_name, p.station_id, p.name as station_name, ST_Distance(g.geom, p.geom) as distance
		from
			${schemaName}.${tblAdm} g, ${schemaName}.${tblWeatherPoints} p
		where
			ST_DWithin(g.geom, p.geom, 200000)
		order by 
			adm_id, distance
	) as adm
	on adm.station_id in (select distinct f.station_id);`

            client.query(query, (err, result)=>{
                if(err){
                    reject(err.message);
                }
                else {
                    client.end();
                    console.log(`Wind alerts generated for ${result.rows.length} administrative units!`);
                    if(result.rows.length > 0){
                        let r = result.rows[0];
                        console.log(`The first one is: ${JSON.stringify(r)}`);
                    }
                    resolve();
                }
            });   

        });
       
    });
}


//chain all the stuff together
download(downloadUrl, path.join(downloadDir, fileName))
    .then(gunzipFile)
    .then(readJson)
    .then(loadData)
    .then(generateAlerts)
    .catch(err => console.log(`uups, an error has occured: ${err}`));