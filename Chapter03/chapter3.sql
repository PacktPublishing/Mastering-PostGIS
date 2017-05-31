-- Point construction

SELECT ST_MakePoint(391390,5817855);

--Assigning a SRID

SELECT ST_SetSRID(ST_MakePoint(391390,5817855),32633);

--3D point with SRID

SELECT ST_SetSRID(ST_MakePoint(334216.6,5077675.3,4810),32632);

--4D point with SRID

SELECT ST_SetSRID(ST_MakePoint(503612.6,5789004.9,89.5,4.408),32634);

--point with SRID, M-coordinate, no Z:

SELECT ST_SetSRID(ST_MakePointM(503612.6,5789004.9,4.408),32634);

--ST_X and ST_Y

SELECT id, name, ST_X(way) AS x_coord, ST_Y(way) as y_coord FROM planet_osm_point LIMIT 10;

--converstion to Multi- geometry

SELECT ST_AsText(ST_Multi(ST_MakePoint(391390,5817855)));

--ST_Collect examples

SELECT ST_Collect(ST_MakePoint(20,50),ST_MakePoint(19.95,49.98));
SELECT ST_Collect(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96)]);
SELECT amenity, ST_Collect(way) FROM planet_osm_point GROUP BY amenity;

--improper usage (it will throw an error)

SELECT tourism, amenity, ST_Collect(way) FROM planet_osm_point GROUP BY amenity;

--extracting a geometry from MultiPoint

SELECT ST_AsText(ST_GeometryN(ST_Collect(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96)]),2));

--getting the count of component geometries

SELECT ST_NumGeometries(ST_Collect(ARRAY(ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96))));

--dumping a MultiGeometry into a GeometryDump

SELECT ST_Dump(ST_Collect(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96)]));

--extracting geometries from a dump
SELECT (ST_Dump(ST_Collect(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96)]))).geom;

--line composition

SELECT ST_MakeLine(ST_MakePoint(20,50),ST_MakePoint(19.95,49.98));
SELECT ST_SetSRID(ST_MakeLine(ST_MakePoint(20,50),ST_MakePoint(19.95,49.98)),4326);\
SELECT ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96)]);
SELECT ST_MakeLine(gpx.geom ORDER BY time) AS geom
	FROM gpx
	GROUP BY 1;
	
--line decomposition

SELECT ST_NPoints(ST_MakeLine(ST_MakePoint(20,50),ST_MakePoint(19.95,49.98)));
SELECT ST_AsText(ST_PointN(ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96)]),2));
SELECT ST_DumpPoints(ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96)]));
SELECT (ST_DumpPoints(ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96)]))).geom;

--start and end points

SELECT ST_AsText(ST_StartPoint(ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96)])));
SELECT ST_AsText(ST_EndPoint(ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96)])));

--Polygon composition

SELECT ST_MakePolygon(ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.90),ST_MakePoint(20,50)]));

--improper usage, will throw errors

SELECT ST_MakePolygon(ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96)]));
SELECT ST_MakePolygon(ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96),ST_MakePoint(20,50),ST_MakePoint(20.01,50.01)]));

--checking if a ring is closed

SELECT ST_IsClosed(ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96),ST_MakePoint(20,50),ST_MakePoint(20.01,50.01)]));
SELECT ST_IsClosed(ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96),ST_MakePoint(20,50),ST_MakePoint(20,50)]));

--Polygonize

SELECT ST_Polygonize(ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96),ST_MakePoint(20,50),ST_MakePoint(20.01,50.01)]));

--MakePolygon

SELECT ST_MakePolygon(
    ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.90),ST_MakePoint(20,50)]),
    ARRAY[ST_MakeLine(ARRAY[ST_MakePoint(19.95,49.97),ST_MakePoint(19.943,49.963), ST_MakePoint(19.955,49.965),ST_MakePoint(19.95,49.97)])]
);

--dumping vertices of a polygon

SELECT ST_DumpPoints(
    ST_MakePolygon(
        ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.90),ST_MakePoint(20,50)]),
        ARRAY[ST_MakeLine(ARRAY[ST_MakePoint(19.95,49.97),ST_MakePoint(19.943,49.963), ST_MakePoint(19.955,49.965),ST_MakePoint(19.95,49.97)])]
    )
);


--dumping rings

SELECT ST_DumpRings(
    ST_MakePolygon(
        ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.90),ST_MakePoint(20,50)]),
        ARRAY[ST_MakeLine(ARRAY[ST_MakePoint(19.95,49.97),ST_MakePoint(19.943,49.963), ST_MakePoint(19.955,49.965),ST_MakePoint(19.95,49.97)])]
    )
);


--extracting exterior ring

 SELECT ST_ExteriorRing(
    ST_MakePolygon(
        ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.90),ST_MakePoint(20,50)]),
        ARRAY[ST_MakeLine(ARRAY[ST_MakePoint(19.95,49.97),ST_MakePoint(19.943,49.963), ST_MakePoint(19.955,49.965),ST_MakePoint(19.95,49.97)])]
    )
);

--extracting interior rings

SELECT ST_InteriorRingN(
    ST_MakePolygon(
        ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.90),ST_MakePoint(20,50)]),
        ARRAY[ST_MakeLine(ARRAY[ST_MakePoint(19.95,49.97),ST_MakePoint(19.943,49.963), ST_MakePoint(19.955,49.965),ST_MakePoint(19.95,49.97)])]
    ), 1
);

--distance between two points

SELECT ST_Distance(
    ST_SetSRID(ST_MakePoint(367201,5817855),32633),
    ST_SetSRID(ST_MakePoint(391390,5807271),32633) 
)


--distance between two lat-lon points, with and without spheroid

SELECT ST_Distance(ST_MakePoint(20,50)::geography,ST_MakePoint(21,51)::geography);
SELECT ST_Distance(ST_MakePoint(20,50)::geography,ST_MakePoint(21,51)::geography, FALSE);

--line length

SELECT ST_Length(
    ST_MakeLine(ARRAY[ST_MakePoint(391390,5817855),ST_MakePoint(391490,5817955), ST_MakePoint(391590,5818055)])
);

SELECT ST_Length(
    ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.96)])::geography
);

--polygon perimeter

SELECT ST_Perimeter(ST_GeomFromText('POLYGON((391390 5817855,391490 5817955,391590 5818055, 319590 5817855,391390 5817855))', 32633))
SELECT ST_Perimeter(
    ST_MakePolygon(ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.90),ST_MakePoint(20,50)]))::geography
);
SELECT ST_Perimeter(ST_MakePolygon(
    ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.90),ST_MakePoint(20,50)]),
    ARRAY[ST_MakeLine(ARRAY[ST_MakePoint(19.95,49.97),ST_MakePoint(19.943,49.963), ST_MakePoint(19.955,49.965),ST_MakePoint(19.95,49.97)])]
)::geography);

--polygon area

SELECT ST_Area(ST_GeomFromText('POLYGON((391390 5817855,391490 5817955,391590 5818055, 319590 5817855,391390 5817855))', 32633));
SELECT ST_Area(
    ST_MakePolygon(ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.90),ST_MakePoint(20,50)]))::geography
);
SELECT ST_Area(ST_MakePolygon(
    ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98), ST_MakePoint(19.90,49.90),ST_MakePoint(20,50)]),
    ARRAY[ST_MakeLine(ARRAY[ST_MakePoint(19.95,49.97),ST_MakePoint(19.943,49.963), ST_MakePoint(19.955,49.965),ST_MakePoint(19.95,49.97)])]
)::geography);

--bounding box computation

SELECT ST_Extent(
    ST_GeomFromText('POLYGON((391390 5817855,391490 5817955,391590 5818055, 319590 5817855,391390 5817855))', 32633)
);
SELECT ST_Extent(geom) FROM sometable;
SELECT ST_XMin(
    ST_GeomFromText('POLYGON((391390 5817855,391490 5817955,391590 5818055, 319590 5817855,391390 5817855))', 32633)
);

--bounding box creation

SELECT ST_MakeBox2D(
    ST_MakePoint(319590,5817855),
    ST_MakePoint(391590,5818055)
);


--bounding box query

SELECT * FROM planet_osm_point WHERE way && ST_SetSRID('BOX(-500 6705000,1000 6706000)'::box2d,900913);


--testing for simplicity

SELECT ST_IsSimple(ST_MakeLine(ST_MakePoint(20,50),ST_MakePoint(19.95,49.98)));
SELECT ST_IsSimple(ST_MakeLine(ARRAY[ST_MakePoint(20,50),ST_MakePoint(19.95,49.98),ST_MakePoint(19.90,49.90), ST_MakePoint(19.95,49.98)]));
SELECT * FROM planet_osm_line WHERE ST_IsSimple(way) = FALSE;


--testing for validity


SELECT * FROM data_import.ne_110m_land WHERE ST_IsValid(geom) =  FALSE;
SELECT ST_IsValidReason(geom) FROM data_import.ne_110m_land WHERE ST_IsValid(geom) =  FALSE;
SELECT ST_IsValidDetail(geom) FROM data_import.ne_110m_land WHERE ST_IsValid(geom) =  FALSE;
SELECT (ST_IsValidDetail(geom)).location, (ST_IsValidDetail(geom)).reason FROM data_import.ne_110m_land WHERE ST_IsValid(geom) =  FALSE;

--repairing geometries

UPDATE data_import.ne_110m_land SET geom = ST_MakeValid(geom);
SELECT * FROM data_import.ne_110m_land WHERE ST_IsValid(geom) =  FALSE;
UPDATE data_import.ne_110m_land SET geom = ST_Buffer(geom,0) WHERE ST_IsValid(geom) = FALSE;

--validity constraint

ALTER TABLE planet_osm_polygon ADD CONSTRAINT enforce_validity CHECK (ST_IsValid(way));

--intersecting

SELECT ST_Intersects(
    ST_MakeLine(ST_MakePoint(20,50),ST_MakePoint(21,51)),
    ST_MakeLine(ST_MakePoint(20.5,50.5), ST_MakePoint(22,52))
);

SELECT ST_Intersects(
    ST_MakeLine(ST_MakePoint(20,50),ST_MakePoint(21,51)),
    ST_MakeLine(ST_MakePoint(21.5,51.5), ST_MakePoint(22,52))
);

SELECT ne_110m_land.* FROM data_import.ne_110m_land JOIN data_import.earthquakes_subset_with_geom ON ST_Intersects(ne_110m_land.geom, earthquakes_subset_with_geom.geom);

SELECT gid,ST_Intersection(geom,
    ST_SetSRID('POLYGON((-2 53, 2 53, 2 50, -2 50, -2 53))'::geometry,4326)
    ) FROM data_import.ne_coastline WHERE gid = 73;
    
    
-- nearest feature queries

SELECT * FROM data_import.earthquakes_subset_with_geom 
ORDER BY ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(-66.11,18.46),4326)::geography)
LIMIT 5;


SELECT * FROM data_import.os_address_base_gml 
ORDER BY ST_Distance(wkb_geometry::geography, ST_SetSRID(ST_MakePoint(-3.5504,50.7220),4258)::geography)
LIMIT 1;    
ALTER TABLE data_import.os_address_base_gml ALTER COLUMN wkb_geometry SET DATA TYPE geography;

SELECT * FROM data_import.os_address_base_gml 
ORDER BY wkb_geometry <-> ST_SetSRID(ST_MakePoint(-3.5504,50.7220),4258)::geography
LIMIT 1;

WITH prefilter AS (
  SELECT *, ST_Distance(way, ST_SetSRID('POINT(-100 6705148)'::geometry,900913)) AS dist FROM planet_osm_polygon 
  ORDER BY way <-> ST_SetSRID('POINT(-100 6705148)'::geometry,900913) LIMIT 10
)
SELECT * FROM prefilter ORDER BY dist LIMIT 1;




