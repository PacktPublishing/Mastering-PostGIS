Ext.define('Ol3GeoJSON.view.main.Main', {
    extend: 'Ext.panel.Panel',
    xtype: 'app-main',

    requires: [
        'Ext.container.Container',
        'Ext.layout.container.Fit',
        'Ol3GeoJSON.view.main.MainController'
    ],

    controller: 'main',

    title: 'ol3 GeoJSON',

    layout: 'fit',

    items: [{
        xtype: 'container',
        reference: 'mapContainer'
    }]
});