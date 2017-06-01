Ext.define('Ol3Wfs.view.main.MainController', {
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
                center: [155, -15], //australian Great Coral Reef
                zoom: 5
            })
        });
    },

    /**
     * creates layers for the map
     * @returns {[*]}
     */
    createLayers: function(){

        var proj = ol.proj.get('EPSG:4326');
            format = new ol.format.WFS(),
            wfsVectorSource = new ol.source.Vector({
                projection: proj,
                loader: function(extent, resolution, projection) {
                    Ext.Ajax.request({
                        cors: true,
                        url: 'http://localhost:8080/geoserver/wfs?service=WFS&request=GetFeature&version=1.1.0&' +
                        'typename=mastering_postgis:ne_reefs&'+
                        'srsname=EPSG:4326&' +
                        'bbox=' + extent.join(',') + ',EPSG:4326'
                    })
                    .then(function(response){
                        //rad the features
                        var features = format.readFeatures(response.responseText),
                            f = 0, flen = features.length;

                        //and make sure to swap the coords...
                        for(f; f < flen; f++){
                            features[f].getGeometry().applyTransform(
                                /**
                                 * geom coordinates transform fn; note: coords are swapped 'in place' - a feature is modified
                                 * @param {Number[]} inputCoords
                                 * @param {Number[]} outputCoords
                                 * @param {Number[]} dimension - coordinate dimension: XY - 2, XYZ - 3, XYZM - 4; how far to move to another coordinate
                                 */
                                function (coords, coords2, dimension) {
                                    var c = 0, clen = coords.length,
                                        x,y;
                                    for (c; c < clen; c += dimension) {
                                        y = coords[c];
                                        x = coords[c + 1];
                                        coords[c] = x;
                                        coords[c + 1] = y;
                                    }
                                }
                            );
                        }
                        wfsVectorSource.addFeatures(features);
                    });
                },
                //this will make the map request features per tile boundary
                strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
                    extent: proj.getExtent(),
                    maxZoom: 8
                })),
                attributions: [
                    new ol.Attribution({
                        html: 'Mastering PostGIS - GeoServer WFS'
                    })
                ]
            });

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
                source: wfsVectorSource,
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: [153,255,0,1],
                        width: 4
                    })
                })
            })
        ];
    }
});
