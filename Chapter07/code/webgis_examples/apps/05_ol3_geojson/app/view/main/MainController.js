Ext.define('Ol3GeoJSON.view.main.MainController', {
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
     * @property {ol.Map} map instance
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

        //monitor container resize events
        mc.on(
            'resize',
            function(){
                if(this.map){
                    this.map.updateSize();
                }
            },
            this
        );

        this.createMap('map');
    },

    /**
     * Create map
     * @param mapContainerId
     */
    createMap: function(mapContainerId){

        var proj = ol.proj.get('EPSG:4326');

        this.map = new ol.Map({
            layers: this.createLayers(),
            target: mapContainerId,
            controls: ol.control.defaults({
                attributionOptions: {
                    collapsible: false
                }
            }).extend([
                new ol.control.ScaleLine(),
                new ol.control.MousePosition({
                    projection: proj,
                    coordinateFormat: function (coords) {
                        var output = '';
                        if (coords) {
                            output = coords[0].toFixed(5) + ' : ' + coords[1].toFixed(5);
                        }
                        return output;
                    }
                })
            ]),
            view: new ol.View({
                projection: proj,
                extent: proj.getExtent(),
                center: [0, 0], //australian Great Coral Reef
                zoom: 2
            })
        });
    },

    /**
     * creates layers for the map
     * @returns {[*]}
     */
    createLayers: function(){

        var proj = ol.proj.get('EPSG:4326');

        return [
            new ol.layer.Tile({
                source: new ol.source.TileWMS({
                    url: 'http://localhost:8081',
                    params: {
                        'LAYERS': 'ne_raster',
                        'VERSION': '1.1.1',
                        'FORMAT': 'image/jpeg'
                    },
                    projection: proj,
                    extent: proj.getExtent(),
                    attributions: [
                        new ol.Attribution({
                            html: 'Mastering PostGIS - NodeJs WMS'
                        })
                    ]
                })
            }),
            new ol.layer.Vector({
                //projection: proj,
                source: new ol.source.Vector({
                    format: new ol.format.GeoJSON(),
                    url: function(extent) {
                        return 'http://10.0.0.19:8080/geoserver/wfs?service=WFS&' +
                            'version=1.1.0&request=GetFeature&typename=mastering_postgis:earthquakes&' +
                            'outputFormat=application/json&srsname=EPSG:4326&' +
                            'bbox=' + extent.join(',') + ',EPSG:4326';
                    },
                    strategy: ol.loadingstrategy.bbox,
                    attributions: [
                        new ol.Attribution({
                            html: 'Mastering PostGIS - GeoServer GeoJSON'
                        })
                    ]
                }),
                style: function(feature, resolution) {
                    return [
                        new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: feature.get('mag') * 5,
                                stroke: new ol.style.Stroke({
                                    color: [0,52,153,0.8]
                                })
                            })
                        })
                    ];
                }
            })
        ];
    }
});
