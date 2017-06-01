/**
 * This class is the main view for the application. It is specified in app.js as the
 * "mainView" property. That setting automatically applies the "viewport"
 * plugin causing this view to become the body element (i.e., the viewport).
 *
 * TODO - Replace this content of this view to suite the needs of your application.
 */
Ext.define('WebGIS.view.main.Main', {
    extend: 'Ext.container.Container',
    xtype: 'app-main',

    requires: [
        'Ext.layout.container.Border',
        'Ext.layout.container.Fit',
        'Ext.plugin.Viewport',
        'WebGIS.view.leaflet.LeafletMap',
        'WebGIS.view.main.MainController',
        'WebGIS.view.ol3.Ol3Map'
    ],

    controller: 'main',

    layout: 'fit',

    items: [
        {
            xtype: 'ol3map'
        }
    ]
});
