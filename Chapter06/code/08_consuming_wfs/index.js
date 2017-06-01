const pg = require('pg');
const http = require('http');

const dbCredentials = {
    host: 'localhost',
    port: 5434,
    user: 'postgres',
    password: 'postgres',
    database: 'mastering_postgis'
};

const pipelineSchema = 'etl_pipeline';
const pipelineTable = 'pipeline';
const pipelineParcels = 'parcels';

const bufferSizeInMetres = 5;
const bufferOpts = 'endcap=round join=round'; //these the buffer defaults btw

const linzApiKey = '22fc7616960445ae9c0e542cacc4fac0';
const linzWfsHost = 'data.linz.govt.nz';
const linzWfsPath = `/services;key=${linzApiKey}/wfs`;

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
 * buffers the pipeline and returns a buffer geom as WKT
 */
const getPipelineBuffer = function(){
    return new Promise((resolve, reject) => {
        console.log('Buffering pipeline...');

        let client = new pg.Client(dbCredentials);

        client.connect((err) => {
            if(err){
                reject(err.message);
                return;
            }

            //note
            client.query(`select ST_AsGML(ST_Buffer(geom, ${bufferSizeInMetres},  '${bufferOpts}')) as gml from ${pipelineSchema}.${pipelineTable} limit 1;`, function(err, result){
                if(err){
                    client.end();
                    reject(err.message);
                    return;
                }

                client.end();

                if(result.rows.length !== 1)
                {
                    reject('Hmm it looks like we have a little problem with a pipeline...');
                }
                else {
                    console.log('Done!');
                    resolve(result.rows[0].gml);
                }
            });
        });
    });
}

/**
 * extracts parcels intersecting a buffer from a WFS service
 */
const getParcels = function(gml){
    return new Promise((resolve, reject) => {
        console.log('Retrieving parcels...');

        const postData = `
<wfs:GetFeature xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.opengis.net/wfs"
    xmlns:gml="http://www.opengis.net/gml" xmlns:wfs="http://www.opengis.net/wfs"
    xmlns:ogc="http://www.opengis.net/ogc" service="WFS" version="1.0.0" outputFormat="json">
    <wfs:Query typeName="data.linz.govt.nz:layer-772" srsName="EPSG:2193">
        <ogc:Filter>
            <ogc:Intersects>
           	    <ogc:PropertyName>shape</ogc:PropertyName>
                ${gml}
            </ogc:Intersects>
        </ogc:Filter>
    </wfs:Query>
</wfs:GetFeature>`;

        const postOpts = {
            host: linzWfsHost,
            port: 80,
            path: linzWfsPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml',
                'Content-Length': Buffer.byteLength(postData)
            }
        }

        var jsonData = '';

        const postRequest = http.request(postOpts, (res) => {
            res.on('data', (chunk) => {
                progressIndicator.next();
                jsonData += chunk;
            });
            res.on('end', () => {
                console.log('Done!');
                resolve(JSON.parse(jsonData));
            });
            res.on('error', (err)=>{
                reject(err.message);
            });
        });

postRequest.on

        postRequest.write(postData);
        postRequest.end();
        
    });
}

/**
 * helper fn to execute a non-query
 */
const executeNonQuery = function(client, sql, params){
    return new Promise((resolve, reject) => {
        client.query(sql, params, (err, result) => {
                progressIndicator.next();
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
 * saves wfs json parcels to the database
 */
const saveParcels = function(data){
    return new Promise((resolve, reject) => {
        
        console.log('Saving parcels...');

        let client = new pg.Client(dbCredentials);

        client.connect((err) => {
            if(err){
                reject(err.message);
                return;
            }

            const sql = [
                executeNonQuery(client, `DROP TABLE IF EXISTS ${pipelineSchema}.${pipelineParcels};`),
                executeNonQuery(
                    client,
                    `CREATE TABLE ${pipelineSchema}.${pipelineParcels}
                    (id numeric, appellation varchar, affected_surveys varchar, parcel_intent varchar, topology_type varchar,
                    statutory_actions varchar, land_district varchar, titles varchar, survey_area numeric, geom geometry);`
                )
            ];
                        
            for(let f of data.features){
                sql.push(
                    executeNonQuery(
                        client,
                        `INSERT INTO ${pipelineSchema}.${pipelineParcels} 
                        (id, appellation, affected_surveys, parcel_intent, topology_type, statutory_actions, land_district, titles, survey_area, geom)
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,ST_SetSRID(ST_GeomFromGeoJSON($10),2193));`,
                        [
                            f.properties.id,
                            f.properties.appellation,
                            f.properties.affected_surveys,
                            f.properties.parcel_intent,
                            f.properties.topology_type,
                            f.properties.statutory_actions,
                            f.properties.land_district,
                            f.properties.titles,
                            f.properties.survey_area,
                            JSON.stringify(f.geometry)
                        ]
                    )
                );
            }

            Promise.all(sql)
                .then(() => {
                    client.end();
                    console.log('Done!');
                    resolve();
                })
                .catch((err) => {
                    client.end();
                    reject(err)
                });
        });
    });
}

//chain all the stuff together
getPipelineBuffer()
    .then(getParcels)
    .then(saveParcels)
    .catch(err => console.log(`uups, an error has occured: ${err}`));