--make sure our import schema is there
create schema if not exists data_import;

--drop / create table
drop table if exists data_import.earthquakes_csv;
create table data_import.earthquakes_csv (
	"time" timestamp with time zone,
	latitude numeric,
	longitude numeric,
	depth numeric,
	mag numeric,
	magType varchar,
	nst numeric,
	gap numeric,
	dmin numeric,
	rms numeric,
	net varchar,
	id varchar,
	updated timestamp with time zone,
	place varchar,
	type varchar,
	horizontalError numeric,
	depthError numeric,
	magError numeric,
	magNst numeric,
	status varchar,
	locationSource varchar,
	magSource varchar
);
--copy the data froma a csv file
copy data_import.earthquakes_csv from 'F:\mastering_postgis\chapter02\data\2.5_day.csv' with DELIMITER ',' CSV HEADER;

--we can create a table and then insert data into it
/*
drop table if exists data_import.earthquakes_csv_subset;
create table data_import.earthquakes_csv_subset(
	id varchar,
	"time" timestamp with time zone,
	latitude numeric,
	longitude numeric,
	depth integer,
	mag numeric,
	magType varchar
);
insert into data_import.earthquakes_csv_subset
select
	id,
	"time",
	latitude,
	longitude,
	depth,
	mag,
	magType
from
	data_import.earthquakes_csv
*/
--or just select into
drop table if exists data_import.earthquakes_csv_subset;
select
	id,
	"time",
	latitude,
	longitude,
	depth,
	mag,
	magType
into data_import.earthquakes_csv_subset
from
	data_import.earthquakes_csv;
