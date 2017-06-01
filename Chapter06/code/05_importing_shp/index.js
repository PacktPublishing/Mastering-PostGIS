const fs = require('fs');
const http = require('http');
const path = require('path');
const unzip = require('unzip');
const pg = require('pg');
const exec = require('child_process').exec;


const downloadUrl = 'http://www.gis-support.pl/downloads/gminy.zip';
const downloadDir = '\\192.168.0.200\BookDrafts\3683_Mastering PostGIS\Code\ch 7\data\05_importing_shp';
const fileName = 'gminy.zip';

const dbCredentials = {
    host: 'localhost',
    port: 5434,
    user: 'postgres',
    password: 'postgres',
    database: 'mastering_postgis'
};
const schemaName = 'weather_alerts';
const tblName = 'gminy';

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
 * unzips a specified file to the same directory
 */
const unzipFile = function(zipFile){
    return new Promise((resolve, reject) => {
        console.log(`Unzipping '${zipFile}'...`);

        //Note: the archive is unzipped to the directory it resides in
        fs.createReadStream(zipFile)
            .on('data', (chunk)=>{ progressIndicator.next() })
            .pipe(unzip.Extract({ path: path.dirname(zipFile) }))
            //when ready return file name, so can use it to load a file to the db...
            .on('close', ()=>{
                progressIndicator.reset();
                console.log('Unzipped!');
                resolve(zipFile.replace('zip', 'shp')); //Note: in this case shp file name is same as the archive name!
            });
    });
}

/**
 * checks if database is ready for data import
 */
const dbCheckup = function(shp){
    return new Promise((resolve, reject) => {
        console.log('Checking up the database...');

        let client = new pg.Client(dbCredentials);

        client.connect((err) => {
            if(err){
                reject(err.message);
                return;
            }

            client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName};`, (err, result) => {
                if(err){
                    reject(err.message);
                }
                else {
                    client.end();
                    console.log('Database ready!');
                    resolve(shp);
                }
            });
        });      
    });
}

/**
 * loads a shapefile to a database
 */
const dbLoad = function(shp){
    return new Promise((resolve, reject) => {
        console.log('Loading shapefile...');
        let dbc = dbCredentials;
        let cmd = `ogr2ogr -f "PostgreSQL" PG:"host=${dbc.host} port=${dbc.port} user=${dbc.user} dbname=${dbc.database}" "${shp}" -t_srs EPSG:2180 -nlt PROMOTE_TO_MULTI -nln ${schemaName}.${tblName} -overwrite -lco GEOMETRY_NAME=geom`;

        console.log(`Executing command: ${cmd}`);

        exec(cmd, (err, stdout, stderr) => {
            if(err){
                reject(err.message);
                return;
            }
            console.log(stdout || stderr);
            resolve();
        });
    });
}

/**
 * counts imported records
 */
const dbLoadTest = function(){
    return new Promise((resolve, reject) => {
        console.log('Verifying import...');

        let client = new pg.Client(dbCredentials);

        client.connect((err) => {
            if(err){
                reject(err.message);
                return;
            }

            client.query(`SELECT Count(*) as rec_count FROM ${schemaName}.${tblName};`, (err, result) => {
                if(err){
                    reject(err.message);
                }
                else {
                    client.end();
                    console.log(`Imported ${result.rows[0].rec_count} records!`);
                    resolve();
                }
            });
        });      
    });
}

//chain all the stuff together
download(downloadUrl, path.join(downloadDir, fileName))
    .then(unzipFile)
    .then(dbCheckup)
    .then(dbLoad)
    .then(dbLoadTest)
    .catch(err => console.log(`uups, an error has occured: ${err}`));