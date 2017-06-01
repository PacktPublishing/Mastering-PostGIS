/**
 * This class is the controller for the main view for the application. It is specified as
 * the "controller" of the Main view class.
 *
 * TODO - Replace this content of this view to suite the needs of your application.
 */
Ext.define('Ol3TopoJson.view.main.MainController', {
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
                    format: new ol.format.TopoJSON(),
                    url: 'data/topojson.json',
                    attributions: [
                        new ol.Attribution({
                            html: 'Mastering PostGIS - TopoJSON'
                        })
                    ]
                }),
                style: [
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'rgba(0, 0, 0, 1)',
                            width: 0.5
                        })
                    })
                ]
            })
        ];
    }

});
