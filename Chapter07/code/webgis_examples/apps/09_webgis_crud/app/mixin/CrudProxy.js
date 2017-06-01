//Disable some of the JSLint warnings
/*global window,console,Ext,mh*/
(function(){
    //Make sure strict mode is on
    'use strict';

    var duringRead = false,
        readEndListeners = [],
        maskers = [],
        apiEndPoint = 'http://localhost:8082/webgisapi/features/';

    /**
    * Created by info_000 on 23-Nov-16.
    */
    Ext.define('WebGIS.mixin.CrudProxy', {

        /**
         * registers a read end callback fn that will be executed when features are read!
         * @param fn
         */
        registerGetFeaturesListener: function(fn){
            var me = this;

            readEndListeners.push(Ext.bind(
                function(features){
                    me.getView().unmask();
                    fn.apply(this, [features]);
                }, this)
            );

            maskers.push(function(msg){
                if(msg){
                    me.getView().mask(msg);
                }
                else {
                    me.getView().unmask();
                }
            });
        },

        /**
         * masks all the registered views
         * @param msg
         */
        maskViews: function(msg){
            Ext.Array.each(maskers, function(fn){
                fn(msg);
            });
        },

        /**
         * reads features off the server
         */
        getFeatures: function(){
            console.warn('[CRUD PROXY] - reading...');

            this.maskViews('Reading features...');

            if(duringRead){
                return;
            }

            duringRead = true;

            Ext.Ajax.request({
                cors: true,
                url: apiEndPoint,
                success: Ext.bind(this.onGetFeaturesSuccess, this),
                failure: Ext.bind(this.onGetFeaturesFailure, this)
            });
        },

        /**
         * read success
         * @param response
         */
        onGetFeaturesSuccess: function(response){
            duringRead = false;
            this.maskViews(false);
            this.finaliseRead(Ext.JSON.decode(response.responseText));
        },

        /**
         * read failure
         */
        onGetFeaturesFailure: function(response){
            duringRead = false;
            this.maskViews(false);

            var me = this;

            //some feedback
            if(response.status !== 404){ //404 is err, but not really in our case!
                Ext.MessageBox.show({
                    title: 'Read error',
                    message: 'Failed to read features',
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.MessageBox.ERROR,
                    fn: function(){
                        me.finaliseRead([]);
                    }
                });
            }
            else {
                me.finaliseRead([]);
            }
        },

        /**
         * finalises read, executes all the registered callbacks
         * @param features
         */
        finaliseRead: function(features){
            Ext.Array.each(readEndListeners, function(fn){
                fn(features);
            });
        },

        /**
         * saves a feature
         * @param f
         * @param f.wkt
         * @param f.id
         */
        saveFeature: function(f){

            console.warn('[CRUD PROXY] - saving...', f);

            Ext.Ajax.request({
                cors: true,
                url: isNaN(f.id) ? apiEndPoint : (apiEndPoint + f.id),
                method: isNaN(f.id) ? 'POST' : 'PUT',
                success: Ext.bind(this.onSaveSuccess, this),
                failure: Ext.bind(this.onSaveFailure, this),
                params: f
            });
        },

        /**
         * save success
         */
        onSaveSuccess: function() {
            this.maskViews(false);
            this.finaliseSaveOrDelete();
        },

        /**
         * save failure
         */
        onSaveFailure: function(){
            this.maskViews(false);
            var me = this;

            //some feedback
            Ext.MessageBox.show({
                title: 'Save error',
                message: 'Failed to save feature',
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR,
                fn: function(){
                    me.finaliseSaveOrDelete();
                }
            });
        },

        /**
         * finalises save & delete ops...
         */
        finaliseSaveOrDelete: function(){
            //this is simplistic really - to keep things simple and avoid syncing both maps... jut reload data.
            //far from optimal approach. but good enough for the demo purposes
            this.getFeatures();
        },

        /**
         * destroys a feature
         * @param f
         * @param f.wkt
         * @param f.id
         */
        destroyFeature: function(f){
            console.warn('[CRUD PROXY] - destroying...', f);

            Ext.Ajax.request({
                cors: true,
                url: apiEndPoint + f.id,
                method: 'DELETE',
                success: Ext.bind(this.onDestroySuccess, this),
                failure: Ext.bind(this.onDestroyFailure, this)
            });
        },

        /**
         * save success
         */
        onDestroySuccess: function() {
            this.maskViews(false);
            this.finaliseSaveOrDelete();
        },

        /**
         * save failure
         */
        onDestroyFailure: function(){
            this.maskViews(false);
            var me = this;

            //some feedback
            Ext.MessageBox.show({
                title: 'Delete error',
                message: 'Failed to delete feature',
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR,
                fn: function(){
                    me.finaliseSaveOrDelete();
                }
            });
        },

        /**
         * buffers feature
         * @param f
         * @param f.wkt
         * @param f.id
         */
        bufferFeature: function(f, buffer){
            console.warn('[CRUD PROXY] - buffering...', f, buffer);

            this.maskViews('Buffering feature...');

            Ext.Ajax.request({
                cors: true,
                url: apiEndPoint + 'buffers',
                method: 'POST',
                params: {
                    wkt: f.wkt,
                    buffer: buffer
                },
                success: Ext.bind(this.onBufferSuccess, this),
                failure: Ext.bind(this.onBufferFailure, this)
            });
        },

        /**
         * bufferingg succeeded
         */
        onBufferSuccess: function(response){
            this.maskViews(false);

            if(Ext.isFunction(this.addBuffer)){
                this.addBuffer(response.responseText);
            }
        },

        /**
         * buffering failed
         */
        onBufferFailure: function(){
            this.maskViews(false);
            //some feedback
            Ext.MessageBox.show({
                title: 'Buffer error',
                message: 'Failed to generate a buffer',
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR
            });
        }

    });
}());