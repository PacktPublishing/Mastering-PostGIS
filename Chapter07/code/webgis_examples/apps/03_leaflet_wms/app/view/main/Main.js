
Ext.define('LeafletWms.view.main.Main', {
    extend: 'Ext.panel.Panel',
    xtype: 'app-main',

    requires: [
        'Ext.container.Container',
        'Ext.layout.container.Fit',
        'LeafletWms.view.main.MainController'
    ],

    controller: 'main',

    title: 'Leaflet WMS',

    layout: 'fit',

    items: [{
        xtype: 'container',
        reference: 'mapContainer'
    }]
});
