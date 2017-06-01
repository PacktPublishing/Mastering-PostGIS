Ext.define('LeafletGeoJSON.view.main.MainController', {
    extend: 'Ext.app.ViewController',

    alias: 'controller.main',

    /**
     * view controller init logic
     */
    init: function(){
        //watch the map layout evt - at this stage we should be able to obtain an element to render a map into
        this.lookupReference('mapContainer').on('afterlayout', this.onMapContainerReady, this, {single: true});
    },

    /**
     * @property {L.Map} map instance
     * @private
     */
    map: null,

    /**
     * afteralayout callback - this is where a map gets rendered
     * @private
     * @param mc
     * @param eOpts
     */
    onMapContainerReady: function(mc, eOpts){

        Ext.get(mc.getEl().dom.id + '-innerCt').dom.innerHTML =
            '<div id="map" style="position:absolute; overflow: hidden; width: 100%; height: 100%;"></div>';

        this.createMap('map');
    },

    /**
     * Create map
     * @param mapContainerId
     */
    createMap: function(mapContainerId){
        this.map = new L.Map(mapContainerId, {
            crs: L.CRS.EPSG4326,
            layers: this.createLayers()
        }).setView([0,0],1);

        L.control.scale().addTo(this.map);

        this.loadGeoJSON(this.map);
    },

    /**
     * loads geoJSON data onto a GeJSON layer
     */
    loadGeoJSON: function(map){
        Ext.Ajax.request({
            cors: true,
            url: 'http://10.0.0.19:8080/geoserver/wfs?service=WFS&' +
                'version=1.1.0&request=GetFeature&typename=mastering_postgis:earthquakes&' +
                'outputFormat=application/json&srsname=EPSG:4326&' +
                'bbox=-180,-90,180,90,EPSG:4326'
        }).then(function(response){
            var l = L.geoJson(Ext.JSON.decode(response.responseText).features, {
                /**
                 * converts a point feature to a circle marker so we can style its size
                 * @param feature
                 * @param latlng
                 * @returns {*}
                 */
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: feature.properties.mag * 5,
                        fillColor: '#993366',
                        weight: 1
                    });
                }
            });
            //note: by default geojson layer does not suppor attributon so need to hook into it this way:
            l.getAttribution = function(){return 'Mastering PostGIS - GeoServer GeoJSON';};
            l.addTo(map);
        });
    },

    /**
     * creates layers for the map
     * @returns {[*]}
     */
    createLayers: function(){
        return [
            L.tileLayer.wms('http://localhost:8081', {
                layers: 'ne_raster',
                version: '1.1.1',
                format: 'image/png',
                transparent: true,
                maxZoom: 8,
                minZoom: 0,
                continuousWorld: true,
                attribution: 'Mastering PostGIS - NodeJs WMS handler reading pgraster'
            })
        ];
    }
});
