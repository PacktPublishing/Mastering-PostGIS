//Disable some of the JSLint warnings
/*global window,console,Ext,mh*/
(function(){
    //Make sure strict mode is on
    'use strict';

    /**
     * Created by info_000 on 23-Nov-16.
     * This is just a module stub. use it as a astarter if you happen to like Leaflet more tha ol3 and prefere implementing web editing in L
     */
    Ext.define('WebGIS.view.leaflet.LeafletMapController', {
        extend: 'Ext.app.ViewController',
        alias: 'controller.leafletmap',

        requires: [
        'Ext.form.field.Checkbox'
    ],

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
                '<div id="leafletmap" style="position:absolute; overflow: hidden; width: 100%; height: 100%;"></div>';

            this.createMap('leafletmap');
        },

        /**
         * Create map
         * @param mapContainerId
         */
        createMap: function(mapContainerId){
            this.map = new L.Map(mapContainerId, {
                crs: L.CRS.EPSG4326,
                editable: true
            }).setView([-15,155], 3);

            this.createLayers();

            L.control.scale().addTo(this.map);
        },

        /**
         * creates layers for the map
         * @returns {[*]}
         */
        createLayers: function(){

            var layersPane = this.lookupReference('layers'),
                layers = {
                    'Natural Earth Raster - NodeJS WMS': L.tileLayer.wms('http://localhost:8081', {
                        layers: 'ne_raster',
                        version: '1.1.1',
                        format: 'image/png',
                        transparent: true,
                        maxZoom: 8,
                        minZoom: 0,
                        continuousWorld: true,
                        attribution: 'Mastering PostGIS - NodeJs WMS handler reading pgraster'
                    }),
                    'Natural Earth Vector - GeoServer WMS':  L.tileLayer.wms('http://10.0.0.19:8080/geoserver/wms?', {
                        layers: 'mastering_postgis:ne_coastline,mastering_postgis:ne_reefs',
                        version: '1.1.1',
                        format: 'image/png',
                        transparent: true,
                        maxZoom: 8,
                        minZoom: 0,
                        continuousWorld: true,
                        attribution: 'Mastering PostGIS - GeoServer vector'
                    })
                };

            Ext.Array.each(Ext.Object.getKeys(layers), function(key, idx){
                layersPane.insert(0, {
                    xtype: 'checkbox',
                    boxLabel: key,
                    checked: true,
                    layerZIndex: idx,
                    layer: layers[key],
                    listeners: {
                        change: 'layerVisibilityChange'
                    }
                });
                layers[key].addTo(this.map);
            }, this);

        },

        /**
         * checkbox check change evt handler - changes layer visibility based on the checkbox value
         * @param checkbox
         * @param newV
         * @param oldV
         * @param eOpts
         */
        layerVisibilityChange: function(checkbox, newV, oldV, eOpts){
            //no way of turning a layer on off. need to add / remove layer and then set zindex...
            if(newV){
                this.map.addLayer(checkbox.layer);
                checkbox.layer.setZIndex(checkbox.layerZIndex);
            }
            else {
                this.map.removeLayer(checkbox.layer);
            }
        },

        /**
         * btn add feature toggle handler
         * @param btn
         */
        onBtnAddToggle: function(btn, state){

        },

        /**
         * btn edit feature toggle handler
         * @param btn
         */
        onBtnEditToggle: function(btn, state){

        },

        /**
         * btn delete feature toggle handler
         * @param btn
         */
        onBtnDeleteToggle: function(btn, state){

        },

        /**
         * btn buffer feature toggle handler
         * @param btn
         */
        onBtnBufferToggle: function(btn, state){

        },

        /**
         * btn delete buffers click
         * @param btn
         */
        onBtnDeleteBuffersClick: function(btn){

        }
    });

}());