//Disable some of the JSLint warnings
/*global window,console,Ext,mh*/
(function(){
    //Make sure strict mode is on
    'use strict';

    /**
     * Created by info_000 on 10-Dec-16.
     */
    Ext.define('pgRouting.view.main.MainController', {
        extend: 'Ext.app.ViewController',
        alias: 'controller.app-main',

        requires: [
        'Ext.form.field.Checkbox'
    ],

    /**
         * Called when the view is created
         */
        init: function() {
            //watch the map layout evt - at this stage we should be able to obtain an element to render a map into
            this.lookupReference('mapContainer').on('afterlayout', this.onMapContainerReady, this, {single: true});
        },

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

        },

        /**
         * Create map
         * @param mapContainerId
         */
        createMap: function(mapContainerId){

            var proj = ol.proj.get('EPSG:4326');

            this.map = new ol.Map({
                target: mapContainerId,
                layers: [
                    new ol.layer.Tile({
                        source: new ol.source.OSM()
                    })
                ],
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
                    center: [1822600, 6141900],
                    zoom: 12
                })
            });

            this.createVectorLayers();
        },


        /**
         * creates layers for the map
         * @returns {[*]}
         */
        createVectorLayers: function(){

            this.routesLayer = new ol.layer.Vector({
                source: new ol.source.Vector(),
                style: (function() {
                    var lineStyle = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            width: 4,
                            color: [0,52,153,0.8]
                        })
                    });
                    var lbl = new ol.style.Style({
                        text: new ol.style.Text({
                            text: '',
                            scale: 1.3,
                            textAlign: 'left',
                            offsetY: -12,
                            offsetX: 12,
                            fill: new ol.style.Fill({
                                color: '#000000'
                            }),
                            stroke: new ol.style.Stroke({
                                color: [255,255,153,0.8],
                                width: 3.5
                            })
                        })
                    });

                    return function(feature, resolution) {

                        var fillColor = [0,52,153,0.5],
                            strokeColor = [0,52,153,0.8];
                        if(feature.get('action') === 'add_sp'){
                            fillColor = [14,88,13,0.5];
                            strokeColor = [14,88,13,0.8];
                        }
                        else if(feature.get('action') === 'add_ep'){
                            fillColor = [202,23,59,0.5];
                            strokeColor = [202,23,59,0.8];
                        }

                        var pointStyle = new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 10,
                                fill: new ol.style.Fill({
                                    color: fillColor
                                }),
                                stroke: new ol.style.Stroke({
                                    color: strokeColor
                                })
                            })
                        });

                        lbl.getText().setText(feature.get("nodeId"));

                        return [lbl,lineStyle, pointStyle];
                    };
                })()
            });

            this.dtzLayer = new ol.layer.Vector({
                source: new ol.source.Vector(),
                style: (function() {
                    var area = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            width: 4,
                            color: [0,52,153,0.8]
                        }),
                        fill: new ol.style.Fill({
                            color: [0,52,153,0.35]
                        })
                    });
                    var point = new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 10,
                            fill: new ol.style.Fill({
                                color: [0,52,153,0.35]
                            }),
                            stroke: new ol.style.Stroke({
                                color: [0,52,153,0.8]
                            })
                        })
                    });
                    var lbl = new ol.style.Style({
                        text: new ol.style.Text({
                            text: '',
                            scale: 1.3,
                            textAlign: 'left',
                            offsetY: -12,
                            offsetX: 12,
                            fill: new ol.style.Fill({
                                color: '#000000'
                            }),
                            stroke: new ol.style.Stroke({
                                color: [255,255,153,0.8],
                                width: 3.5
                            })
                        })
                    });

                    return function(feature, resolution) {
                        lbl.getText().setText(feature.get("nodeId"));
                        return [lbl,point, area];
                    };
                })()
            });

            var layersPane = this.lookupReference('layers'),
                layers = {
                    'Routes - PostGIS generated': this.routesLayer,
                    'Drive time zones': this.dtzLayer
                };

            Ext.Array.each(Ext.Object.getKeys(layers), function(key, idx){
                layersPane.add({
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
         * activates map interaction for an action btn
         * @param btn
         * @param state
         */
        onBtnActionToggle: function(btn, state){
            state ? this.addInteraction(btn.reference) : this.clearInteraction(btn.reference);
        },

        /**
         * initiates route calculation
         */
        onBtnCalculateRouteClick: function(){
            //need to collect source & target
            var source,
            target;

            Ext.Array.each(this.routesLayer.getSource().getFeatures(), function(f){
                if(f.get('action') === 'add_sp'){
                    source = f.get('nodeId');
                }
                if(f.get('action') === 'add_ep'){
                    target = f.get('nodeId');
                }
            });

            if(source === undefined || target === undefined){
                Ext.MessageBox.show({
                    title: 'Missing start or end point!',
                    message: 'In order to calculate a route start and end points are needed',
                    icon: Ext.MessageBox.WARNING,
                    buttons: Ext.MessageBox.OK
                })
                return;
            }

            this.calculateRoute(source, target);
        },

        /**
         * clears routes layer
         */
        onBtnClearRouteClick: function(){
            this.routesLayer.getSource().clear();
        },

        /**
         * clears dtz layer
         */
        onBtnDeleteDtzClick: function(){
            this.dtzLayer.getSource().clear();
        },

        /**
         * currently activated action
         */
        currentAction: null,

        /**
         * enables a map interaction for given action
         * @param action
         */
        addInteraction: function(action){
            this.currentAction = action;
            this.currentInteractions = this.currentInteractions || {};

            this.currentInteractions[action] = new ol.interaction.Draw({
                type: 'Point',
                source: action === 'add_dtz' ? this.dtzLayer.getSource() : this.routesLayer.getSource()
            });
            this.currentInteractions[action].on('drawend', this.onDrawEnd, this);

            this.map.addInteraction(this.currentInteractions[action]);
        },

        /**
         * clears a map interaction for an action
         * @param action
         */
        clearInteraction: function(action){
            if(this.currentInteractions && this.currentInteractions[action]){
                this.currentInteractions[action].un('drawend', this.onDrawEnd, this);
                this.map.removeInteraction(this.currentInteractions[action]);
                this.currentInteractions[action] = null;
            }
        },

        /**
         * unmasks the view and toggles btns false
         */
        unmask: function(){
            this.getView().unmask();
            if(this.currentAction){
                this.lookupReference(this.currentAction).toggle(false);
            }
        },

        /**
         * cache of the current point features
         */
        currentFeatures: null,

        /**
         * point input end callback
         * @param e
         */
        onDrawEnd: function(e){
            //need to snap the point to the network first
            this.getView().mask('Snapping a point to a network node...');

            this.currentFeatures = this.currentFeatures || {};
            this.currentFeatures[this.currentAction] = e.feature;

            //transform a point to lon/lat - our network data is in epsg:4326
            var c = e.feature.getGeometry().getFirstCoordinate(),
                tc = ol.proj.transform(c, 'EPSG:3857', 'EPSG:4326');

            Ext.Ajax.request({
                url: 'http://localhost:8082/pgroutingapi/snaptonetwork',
                cors: true,
                method: 'GET',
                params: {
                    lon: tc[0],
                    lat: tc[1]
                },
                success: this.onPointSnappedSuccess,
                failure: this.onPointSnappedFailure,
                scope: {
                    me: this,
                    f: e.feature
                }
            });
        },

        /**
         * point snap success handler
         * @param response
         */
        onPointSnappedSuccess: function(response){
            var me = this.me,
                data = Ext.JSON.decode(response.responseText);

            me.unmask();
            me.cleanNode();


            //show the query in the panel
            me.printQuery(data.query);

            me.snapNode(this.f, data.node);

            if(me.currentAction === 'add_dtz'){
                me.addDtzPoint(data.node);
            }
        },

        /**
         * snaps node to a coord received from the server
         * @param f
         * @param node
         */
        snapNode: function(f, node){
            f.setGeometry(
                new ol.geom.Point(ol.proj.transform([parseFloat(node.lon), parseFloat(node.lat)], 'EPSG:4326', 'EPSG:3857'))
            );
            f.set('action', this.currentAction);
            f.set('nodeId', node.id);
        },

        /**
         * cleans node of given type
         */
        cleanNode: function(){
            var me = this,
                l  = me.currentAction === 'add_dtz' ? me.dtzLayer : me.routesLayer;

            //find and destroy a feature with given action
            Ext.Array.each(l.getSource().getFeatures(), function(f){
                if(f.get('action') === me.currentAction){
                    l.getSource().removeFeature(f);
                    return false;
                }
            });
        },

        /**
         * prints query
         * @param query
         */
        printQuery: function(query){
            this.lookupReference('lastQuery').setHtml(query.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp'));
        },

        /**
         * point snapped failure handler
         * @param response
         */
        onPointSnappedFailure: function(response){
            var me = this.me,
                l = me.currentAction === 'add_dtz' ? me.dtzLayer : me.routesLayer;

            l.getSource().removeFeature(this.f);

            me.unmask();
            me.cleanNode();
            Ext.MessageBox.show({
                title: 'Point snap failure',
                message: 'Failed to snap a point to a network node' + (response.responseText ? ':<br/>' + response.responseText : ''),
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR
            });
        },

        calculateRoute: function(source, target){
            //need to snap the point to the network first
            this.getView().mask('Calculating route...');

            Ext.Ajax.request({
                url: 'http://localhost:8082/pgroutingapi/calculateroute',
                cors: true,
                method: 'GET',
                params: {
                    source: source,
                    target: target
                },
                success: this.onRouteCalculateSuccess,
                failure: this.onRouteCalculateFailure,
                scope: this
            });
        },

        /**
         * route calculate success callback
         * @param response
         */
        onRouteCalculateSuccess: function(response){
            this.getView().unmask();

            var data = Ext.JSON.decode(response.responseText);

            this.printQuery(data.query);
            if(data.wkt){
                this.addVectorFeature(this.routesLayer, data.wkt);
            }
            else {
                Ext.MessageBox.show({
                    title: 'Route calculate failure',
                    message: 'Could not calculate a route. Please try another set of points.',
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.MessageBox.ERROR
                });
            }
        },

        /**
         * route calculate failure callback
         * @param response
         */
        onRouteCalculateFailure: function(response){
            this.getView().unmask();
            Ext.MessageBox.show({
                title: 'Route calculate',
                message: 'Failed to calculate a route' + (response.responseText ? ':<br/>' + response.responseText : ''),
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR
            });
        },

        /**
         * adds a vector feature to a layer
         * @param layer
         * @param wkt
         */
        addVectorFeature: function(layer, wkt){
            //first clear features without node id
            Ext.Array.each(layer.getSource().getFeatures(), function(f){
                if(!f.get('nodeId')){
                    layer.getSource().removeFeature(f);
                }
            });

            //and next add the incoming feature
            var f = this.getWktFormat().readFeature(wkt);
            f.getGeometry().transform('EPSG:4326', 'EPSG:3857');
            layer.getSource().addFeatures([f]);
        },

        /**
         * adds a dtz point
         * @param node
         */
        addDtzPoint: function(node){
            Ext.MessageBox.prompt(
                'Driving time',
                'Please specify the driving time in seconds',
                function(btn, value){
                    var source,
                        timeSpan = parseInt(value);
                    if(btn === 'ok' && !isNaN(timeSpan) && timeSpan > 0){
                        //get the source node
                        Ext.Array.each(this.dtzLayer.getSource().getFeatures(), function(f){
                            if(f.get('nodeId')){
                                source = f.get('nodeId');
                                return false;
                            }
                        });
                        this.calculateDtz(source, timeSpan);
                    }
                },
                this,
                false,
                180
            );
        },

        /**
         * calculates a drive time zone for given source node nad time span
         * @param source
         * @param timeSpan
         */
        calculateDtz: function(source, timeSpan){
            //need to snap the point to the network first
            this.getView().mask('Calculating route...');

            Ext.Ajax.request({
                url: 'http://localhost:8082/pgroutingapi/calculatedtz',
                cors: true,
                method: 'GET',
                params: {
                    source: source,
                    timeSpan: timeSpan
                },
                success: this.onDtzCalculateSuccess,
                failure: this.onDtzCalculateFailure,
                scope: this
            });
        },

        /**
         * dtz calculate success callback
         * @param response
         */
        onDtzCalculateSuccess: function(response){
            this.getView().unmask();

            var data = Ext.JSON.decode(response.responseText);

            this.printQuery(data.query);
            if(data.wkt){
                this.addVectorFeature(this.dtzLayer, data.wkt);
            }
            else {
                Ext.MessageBox.show({
                    title: 'Drive time zone calculate failure',
                    message: 'Could not calculate a drove time zone. Please try another point.',
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.MessageBox.ERROR
                });
            }
        },

        /**
         * dtz calculate failure callback
         * @param response
         */
        onDtzCalculateFailure: function(response){
            this.getView().unmask();
            Ext.MessageBox.show({
                title: 'Drive time zone calculate failure',
                message: 'Failed to calculate a drive time zone' + (response.responseText ? ':<br/>' + response.responseText : ''),
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR
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