drop table if exists data_import.earthquakes_subset_with_geom;
select 
	id,
	"time",
	depth,
	mag,
	magtype,
	place,
	ST_SetSRID(ST_Point(longitude, latitude), 4326) as geom
into data_import.earthquakes_subset_with_geom
from data_import.earthquakes_csv;