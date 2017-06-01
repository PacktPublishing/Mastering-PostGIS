//Disable some of the JSLint warnings
/*global window,console,Ext,mh*/
(function(){
    //Make sure strict mode is on
    'use strict';

    /**
     * Created by info_000 on 23-Nov-16.
     */
    Ext.define('WebGIS.view.ol3.Ol3MapController', {
        extend: 'Ext.app.ViewController',
        alias: 'controller.ol3map',

        requires: [
            'Ext.form.field.Checkbox'
        ],

        mixins: [
            'WebGIS.mixin.CrudProxy'
        ],

        /**
         * view controller init logic
         */
        init: function(){
            //watch the map layout evt - at this stage we should be able to obtain an element to render a map into
            this.lookupReference('mapContainer').on('afterlayout', this.onMapContainerReady, this, {single: true});

            this.registerGetFeaturesListener(this.onReadEnd);
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
                '<div id="ol3map" style="position:absolute; overflow: hidden; width: 100%; height: 100%;"></div>';

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

            this.createMap('ol3map');

            this.getFeatures();
        },

        /**
         * Create map
         * @param mapContainerId
         */
        createMap: function(mapContainerId){

            var proj = ol.proj.get('EPSG:4326');

            this.map = new ol.Map({
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
                    center: [155, -15],
                    zoom: 4
                })
            });

            this.createLayers();
        },

        /**
         * creates layers for the map
         * @returns {[*]}
         */
        createLayers: function(){

            this.vectorLayer = new ol.layer.Vector({
                source: new ol.source.Vector()
            });

            this.buffersLayer = new ol.layer.Vector({
                source: new ol.source.Vector(),
                style: [
                    new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: [153, 204, 153, 0.35]
                        })
                    }),

                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: [153, 204, 153, 1],
                            width: 2
                        })
                    })
                ]
            });

            var proj = ol.proj.get('EPSG:4326'),
                layersPane = this.lookupReference('layers'),
                layers = {
                    'Natural Earth Raster - NodeJS WMS': new ol.layer.Tile({
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

                    'Natural Earth Vector - GeoServer WMS': new ol.layer.Tile({
                        source: new ol.source.TileWMS({
                            url: 'http://10.0.0.19:8080/geoserver/wms',
                            params: {
                                'LAYERS': 'mastering_postgis:ne_coastline,mastering_postgis:ne_reefs',
                                'VERSION': '1.1.1'
                            },
                            projection: proj,
                            extent: proj.getExtent(),
                            attributions: [
                                new ol.Attribution({
                                    html: 'Mastering PostGIS - GeoServer vector'
                                })
                            ]
                        })
                    }),

                    'Buffers - PostGIS generated': this.buffersLayer,

                    'Vector - PostGIS backed': this.vectorLayer
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
                this.map.addLayer(layers[key]);
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
            checkbox.layer.setVisible(newV);
        },

        /**
         * btn add feature toggle handler
         * @param btn
         */
        onBtnAddToggle: function(btn, state){
            this.clearMapInteractions();

            if(!state){
                return;
            }

            this.currentInteractions = {
                draw: new ol.interaction.Draw({
                    type: 'Polygon',
                    source: this.vectorLayer.getSource()
                })
            };
            this.currentInteractions.draw.on('drawend', this.onDrawEnd, this);

            this.map.addInteraction(this.currentInteractions.draw);
        },

        /**
         * btn edit feature toggle handler
         * @param btn
         */
        onBtnEditToggle: function(btn, state){
            this.clearMapInteractions();

            if(!state){
                return;
            }

            var select = new ol.interaction.Select({
                layers: [this.vectorLayer],
                style: this.getEditSelectionStyle()
            });
            this.currentInteractions = {
                select: select,
                modify: new ol.interaction.Modify({
                    features: select.getFeatures(),
                    style: this.getEditStyle()
                })
            };

            this.currentInteractions.select.on('select', this.onModifyStartEnd, this);

            this.map.addInteraction(this.currentInteractions.select);
            this.map.addInteraction(this.currentInteractions.modify);
        },

        /**
         * btn delete feature toggle handler
         * @param btn
         */
        onBtnDeleteToggle: function(btn, state){
            this.clearMapInteractions();

            if(!state){
                return;
            }

            this.currentInteractions = {
                destroy: new ol.interaction.Select({
                    layers: [this.vectorLayer],
                    style: this.getSelectionStyle()
                })
            }

            this.currentInteractions.destroy.on('select', this.onDestroySelect, this);

            this.map.addInteraction(this.currentInteractions.destroy);
        },

        /**
         * btn buffer feature toggle handler
         * @param btn
         */
        onBtnBufferToggle: function(btn, state){
            this.clearMapInteractions();

            if(!state){
                return;
            }

            this.currentInteractions = {
                buffer: new ol.interaction.Select({
                    layers: [this.vectorLayer],
                    style: this.getSelectionStyle()
                })
            }

            this.currentInteractions.buffer.on('select', this.onBufferSelect, this);

            this.map.addInteraction(this.currentInteractions.buffer);
        },

        /**
         * clears all the buffers
         */
        onBtnDeleteBuffersClick: function(){
            this.buffersLayer.getSource().clear();
        },

        /**
         * clears map interactions
         */
        clearMapInteractions: function(){
            if(this.currentInteractions){
                Ext.Array.each(Ext.Object.getKeys(this.currentInteractions), function(i){
                    this.map.removeInteraction(this.currentInteractions[i]);
                }, this);
                this.currentInteractions = null;
            }
        },

        /**
         * gets edit style
         * @returns {[*,*,*,*,*]}
         */
        getEditStyle: function(){
            return [
                new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: [204, 51, 102, 1]
                        })
                    })
                }),
                new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 8,
                        stroke: new ol.style.Stroke({
                            color: [255, 255, 255, 1],
                            width: 1
                        })
                    })
                }),

                new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: [204, 51, 102, 0.15]
                    })
                }),

                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: [255, 255, 255, 1],
                        width: 5
                    })
                }),
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: [204, 51, 102, 1],
                        width: 3
                    })
                })
            ]
        },

        /**
         * gets style for the select interaction control used for edits
         * @returns {[*,*,*,*]}
         */
        getEditSelectionStyle: function(){
            return [
                new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 5,
                        fill: new ol.style.Fill({
                            color: [204, 51, 102, .5]
                        })
                    }),
                    geometry: function(feature) {
                        var coordinates = feature.getGeometry().getCoordinates()[0];
                        return new ol.geom.MultiPoint(coordinates);
                    }
                }),
                new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 6,
                        stroke: new ol.style.Stroke({
                            color: [255, 255, 255, .5],
                            width: 1
                        })
                    }),
                    geometry: function(feature) {
                        var coordinates = feature.getGeometry().getCoordinates()[0];
                        return new ol.geom.MultiPoint(coordinates);
                    }
                }),

                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: [255, 255, 255, 1],
                        width: 5
                    })
                }),
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: [204, 51, 102, 1],
                        width: 3
                    })
                })
            ]
        },

        /**
         * gets a selection style
         * @returns {[*,*,*]}
         */
        getSelectionStyle: function(){
            return [
                new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: [204, 51, 102, 0.15]
                    })
                }),
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: [255, 255, 255, 1],
                        width: 5
                    })
                }),
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: [204, 51, 102, 1],
                        width: 3
                    })
                })
            ]
        },

        /**
         * features read end callback
         * @param features
         */
        onReadEnd: function(data){

            console.warn('[ol3] - read end, loading features...');

            var me = this,
                l = me.vectorLayer,
                features = [];

            //clean the layer
            l.getSource().clear();

            //and reload features
            Ext.Array.each(data, function(d){
                var f = me.getWktFormat().readFeature(
                    d.wkt,
                    {
                        dataProjection: 'EPSG:4326',
                        featureProjection: 'EPSG:4326'
                    }
                );
                f.set('id', d.id);
                features.push(f);
            });

            //load features
            l.getSource().addFeatures(features);
        },

        /**
         * adds a buffer to the buffer layer
         * @param wkt
         */
        addBuffer: function(wkt){
            this.buffersLayer.getSource().addFeatures([this.getWktFormat().readFeature(wkt)]);
        },

        /**
         * draw end callback
         * @param e
         */
        onDrawEnd: function(e){
            console.warn('[ol3] - draw end', e);

            this.saveFeature({
                wkt: this.getWktFormat().writeGeometry(e.feature.getGeometry())
            });
        },

        /**
         * modify end callback
         * @param e
         */
        onModifyStartEnd: function(e){
            console.warn('[ol3] - modify start/end', e);

            if(e.selected.length > 0){
                //this is a select so just a start of edit
                //simply store a wkt on a feature so can compare it later and decide if an edit should happen
                e.selected[0].tempWkt = this.getWktFormat().writeGeometry(e.selected[0].getGeometry());
                return;
            }

            var f = e.deselected[0],
                modifiedWkt = this.getWktFormat().writeGeometry(f.getGeometry());

            if(f.tempWkt === modifiedWkt){
                console.warn('[ol3] - modify end - feature unchanged');
                return;
            }

            console.warn('[ol3] - modify end - saving feature...');

            this.saveFeature({
                id: f.get('id'),
                wkt: modifiedWkt
            });
        },

        /**
         * destroy select - inits destroy action
         * @param e
         */
        onDestroySelect: function(e){
            console.warn('[ol3] - destroy select', e);

            var me = this,
                f = e.selected[0];

            if(!f){
                return;
            }

            //show msg box and ask for confirmation
            Ext.MessageBox.show({
                title: 'Delete',
                msg: 'Are you sure you want to delete a feature?',
                buttons: Ext.MessageBox.OKCANCEL,
                icon: Ext.MessageBox.QUESTION,
                fn: function(btn){
                    if(btn === 'ok'){
                        me.destroyFeature({
                            id: f.get('id')
                        });
                    }

                    me.currentInteractions.destroy.getFeatures().clear();
                }
            });
        },

        /**
         * buffer select - inits buffer action
         * @param e
         */
        onBufferSelect: function(e){
            console.warn('[ol3] - buffer select', e);

            var me = this;

            //show prompt to collect buffer size
            Ext.Msg.prompt('Buffering', 'Please enter buffer size in degrees:', function(btn, text){
                var v = parseFloat(text),
                    f = e.selected[0];

                if(!f){
                    return;
                }

                if (btn == 'ok' && !isNaN(v)){
                    // process text value and close...
                    me.bufferFeature({
                        wkt: me.getWktFormat().writeGeometry(f.getGeometry()),
                        id: f.get('id'),
                    }, v);
                }
                me.currentInteractions.buffer.getFeatures().clear();
            });
        },

        /**
         * @property {ol.format.WKT}
         * @private
         */
        wktFormat: null,

        /**
         * gets a wkt format
         */
        getWktFormat: function(){
            if(!this.wktFormat){
                this.wktFormat = new ol.format.WKT();
            }
            return this.wktFormat;
        }

    });

}());