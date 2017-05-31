--Create model for GB OS Addresses example

--make sure our import schema is there
create schema if not exists data_import;

--drop / create input table
drop table if exists data_import.osgb_addresses;
create table data_import.osgb_addresses(
	uprn bigint,
	os_address_toid varchar,
	udprn integer,
	organisation_name varchar,
	department_name varchar,
	po_box varchar,
	sub_building_name varchar,
	building_name varchar,
	building_number varchar,
	dependent_thoroughfare varchar,
	thoroughfare varchar,
	post_town varchar,
	dbl_dependent_locality varchar,
	dependent_locality varchar,
	postcode varchar,
	postcode_type varchar,
	x numeric,
	y numeric,
	lat numeric,
	lon numeric,
	rpc numeric,
	country varchar,
	change_type varchar,
	la_start_date date,
	rm_start_date date,
	last_update_date date,
	class varchar
);
--copy data_import.osgb_addresses from 'F:\mastering_postgis\chapter02\data\sx9090.csv' with DELIMITER ',' CSV;