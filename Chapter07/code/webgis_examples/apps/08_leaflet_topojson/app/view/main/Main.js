Ext.define('LeafletTopoJson.view.main.Main', {
    extend: 'Ext.panel.Panel',
    xtype: 'app-main',

    requires: [
        'Ext.container.Container',
        'Ext.layout.container.Fit',
        'LeafletTopoJson.view.main.MainController'
    ],

    controller: 'main',

    title: 'Leaflet GeoJSON',

    layout: 'fit',

    items: [{
        xtype: 'container',
        reference: 'mapContainer'
    }]
});
