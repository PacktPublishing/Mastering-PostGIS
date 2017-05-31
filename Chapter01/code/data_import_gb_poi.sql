--Import GB OS POI example

--make sure our import schema is there
create schema if not exists data_import;

--drop / create input table
drop table if exists data_import.osgb_poi;
create table data_import.osgb_poi(
	urn integer,
	name varchar,
	pointx_code varchar,
	easting numeric,
	norting numeric,
	accuracy_code integer,
	uprn varchar,
	topo_toid varchar,
	topo_toid_ver integer,
	itn_easting numeric,
	itn_northing numeric,
	itn_toid varchar,
	itn_toid_ver varchar,
	distance numeric,
	address_detail varchar,
	street varchar,
	locality varchar,
	county varchar,
	postcode varchar,
	verified varchar,
	adm_bound varchar,
	phone varchar,
	url varchar,
	brand varchar,
	qualifier_type varchar,
	qualifier_data varchar,
	provenance varchar,
	supply_date varchar 
);
--finally copy the data over
copy data_import.osgb_poi from 'F:\mastering_postgis\chapter02\data\POI_EXETER_SAMPLE.txt' with DELIMITER '|' CSV HEADER;