/**
 * This class is the controller for the main view for the application. It is specified as
 * the "controller" of the Main view class.
 *
 * TODO - Replace this content of this view to suite the needs of your application.
 */
Ext.define('LeafletTopoJson.view.main.MainController', {
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

        this.loadTopoJSON(this.map);
    },

    /**
     * loads geoJSON data onto a GeJSON layer
     */
    loadTopoJSON: function(map){
        var l1 = L.geoJson(null, {
            weight: 1,
            color: "#999",
            opacity: 1,
            fillColor: "#B0DE5C",
            fillOpacity: 0.3
        }),
            l2 = omnivore.topojson('data/topojson.json', null, l1);
        //note: by default topojson layer does not suppor attributon so need to hook into it this way:
        l2.getAttribution = function(){return 'Mastering PostGIS - TopoJSON';};
        l2.addTo(map);
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
