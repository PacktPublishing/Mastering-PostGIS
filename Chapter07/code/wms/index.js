const http = require('http');
const url = require('url');
const pg = require('pg');

const server = http.createServer((req, res) => {
    
    console.warn('Processing WMS request...', req.url);
    
    let params = url.parse(req.url, true).query; // true to get query as object
    //fix param casing; url param names should not be case sensitive!...
    for(var p of Object.keys(params)){
        let pLowerCase = p.toLowerCase();
        if(p !== pLowerCase){
            params[pLowerCase] = params[p];
            delete params[p];
        }
    }
    
    //validate the request
    if(validateRequest(res, params)){
        processRequest(res, params);
    }
});

const port  = 8081; //another port so we can have it working with geoserver
server.listen(port,  () => {
    console.warn('WMS Server listening on http://localhost:%s', port);
});


/**
 * some WMS settings
 */
const minWidth = 100; const maxWidth = 256;
const minHeight = 100; const maxHeight = 256;
const allowedFormats = ['image/png', 'image/jpeg'];

/**
 * validates oaram presence
 */
const validateParamPresence = (params, pName) => {
    if(params[pName] === undefined){
        throw `Param ${pName} is mandatory but has not been found in the request.`
    }
}

/**
 * validates bounding box
 */
const validateBBox = (bbox) => {
    var bboxParts = bbox.split(',');
    if(bboxParts.length !== 4){
        throw 'Bounding box representation does not seem to be valid';
    }
    //parse bbox numbers
    var bboxParsed = [];
    for(let bp of bboxParts){
        let parsed = parseFloat(bp);
        if(isNaN(parsed)){
            throw `Could not parse bbox part "${bp}" to a number.`;
        }
        bboxParsed.push(parsed);
    }

    if(bboxParsed[0] > bboxParsed[2] || bboxParsed[1] > bboxParsed[3]){
        throw 'One of the bounding box min edges is larger than its max counterpart.'
    }

    if(bboxParsed[0] === bboxParsed[2] || bboxParsed[1] === bboxParsed[3]){
        throw 'One of the bbox dimensions is equal to 0.'
    }
}

const validationRules = [
    (params) => {validateParamPresence(params, 'service')},
    (params) => {if(params.service !== 'WMS'){throw 'This service only supports WMS'}},
    (params) => {validateParamPresence(params, 'version')},
    (params) => {if(params.version !== '1.1.1'){throw 'The only supported version is 1.1.1';}},
    (params) => {validateParamPresence(params, 'request')},
    (params) => {if(params.request !== 'GetMap'){throw 'This service only supports GetMap requests.'}},
    (params) => {validateParamPresence(params, 'format')},
    (params) => {if(allowedFormats.indexOf(params.format.toLowerCase())=== -1) {throw `Unsupported FORMAT: ${params.format}`;}},
    (params) => {validateParamPresence(params, 'layers')},
    (params) => {if(params.layers !== 'ne_raster'){throw 'This service only supports one layer - ne_raster'}},
    (params) => {validateParamPresence(params, 'styles')},
    (params) => {if(params.styles !== ''){throw `Style "${params.layers}" is not supported.`}},
    (params) => {validateParamPresence(params, 'srs')},
    (params) => {if(params.srs !== 'EPSG:4326'){throw `The only supported SRS is EPSG:4326, input was ${params.srs}`}},
    (params) => {validateParamPresence(params, 'bbox')},
    (params) => {validateBBox(params.bbox)},
    (params) => {validateParamPresence(params, 'width')},
    (params) => {if(!params.width){throw "WIDTH parameter is required.";}},
    (params) => {if(params.width > maxWidth){throw `Max WIDTH is ${maxWidth}.`;}},
    (params) => {if(params.width < minWidth){throw `Min WIDTH is ${minWidth}.`;}},
    (params) => {validateParamPresence(params, 'height')},
    (params) => {if(!params.height){throw "HEIGHT parameter is required.";}},
    (params) => {if(params.height > maxHeight){throw `Max HEIGHT is ${maxHeight}.`;}},
    (params) => {if(params.height < minHeight){throw `Min HEIGHT is ${minHeight}.`;}}
];


/**
 * validates the WMS request; returns true if the request is valid and false otherwise. if request is nod valide response writes 400 and closes
 */
const validateRequest = (res, params) => {
    var valid = true;
    try {
        for(var validator of validationRules){
            validator(params);
        }
    }
    catch(e){
        valid = false;
        handleError(res, e);
    }
    return valid;
}

/**
 * handles exception response
 */
const handleError = (res, e) => {
    res.statusCode = 400;
    res.end(e.message || e);
    console.warn(`Ooops, an error occured: ${e.message || e}`);
};

/**
 * gets table name that will provide the best resolution for the requested raster
 */
let getTableName = (tileRes) => {
    //this calculation is specific to our raster:
    //* resolution is based on the raster size in pixels and its bbox
    //* number of overviews is specific to the raster setup
    
    let currentRes = 180 / 10800; //start with the highest res
    let lvl = 0;

    while(tileRes > (currentRes + currentRes / 2) && lvl < 14){
        lvl += 2;
        currentRes *= 2;
    }

    return lvl > 0 ? `o_${lvl}_ne_raster` : 'ne_raster';
}

/**
 * Gets the gdal format for the query
 */
let getGdalFormat = function(format){
    //in this case we just need to get rid of the 'image/' part of mime and make string upper case
    return format.replace('image/', '').toUpperCase();
}

/**
 * generates wms output based on the params. params should be vlaidated prior to calling this method
 */
const processRequest = (res, params) => {

    //prepare some params first
    let w = parseInt(params.width);
    let h = parseInt(params.height);
    let bb = params.bbox.split(',');
    let minX = parseFloat(bb[0]);
    let minY = parseFloat(bb[1]);
    let maxX = parseFloat(bb[2]);
    let maxY = parseFloat(bb[3]);
    let format = getGdalFormat(params.format);

    //get table name based on tile resolution expressed in map units
    let tableName = getTableName(Math.abs(maxX - minX) / w);

    //init client with the appropriate conn details
    const client = new pg.Client({
        host: 'localhost',
        port: 5434,
        user: 'postgres',
        password: 'postgres',
        database: 'mastering_postgis'
    });

    //connect to the database
    client.connect(function(err){
        if(err){
            handleError(res, err);
            return;
        }

        let query = `
select
	--3. union our empty canvas with the extracted raster and resize it to the requested tile size
	ST_AsGDALRaster(
        ST_Resample(
            ST_Union(rast),
            $1::integer,
            $2::integer,
            NULL,NULL,0,0,'Cubic',0.125
        ),
        $3
	)as rast
from (
	--1. empty raster based on the passed bounds and raster settings of the raster data is extracted from;
	--this is our 'canvas' we will paint the extracted raster on.
	--this lets us always output a raster that extends to the requested bounds
	select ST_AsRaster(ST_MakeEnvelope($4,$5,$6,$7,4326), (select rast from webgis.${tableName} limit 1)) as rast
	
	--2. extract the tiles of the raster that interset with bounds of out request and clip them to the requested bound
	union all select 
		ST_Clip(
			ST_Union(rast),
			ST_MakeEnvelope($4,$5,$6,$7,4326)
		)as rast
	from
		webgis.${tableName}
	where
		ST_Intersects(rast, ST_MakeEnvelope($4,$5,$6,$7,4326))	
) as preselect
        `;

        client.query(
            query,
            [w,h,format,minX,minY,maxX,maxY],
            function(err, result){
                client.end();

                if(err){
                    handleError(res, err);
                    return;
                }

                //handle response
                res.statusCode = 200;
                res.setHeader('content-type', params.format);
                res.end(result.rows[0].rast);
            });
        }
    );
}