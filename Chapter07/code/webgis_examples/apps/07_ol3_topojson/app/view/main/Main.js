Ext.define('Ol3TopoJson.view.main.Main', {
    extend: 'Ext.panel.Panel',
    xtype: 'app-main',

    requires: [
        'Ext.container.Container',
        'Ext.layout.container.Fit',
        'Ol3TopoJson.view.main.MainController'
    ],

    controller: 'main',

    title: 'ol3 TopoJSON',

    layout: 'fit',

    items: [{
        xtype: 'container',
        reference: 'mapContainer'
    }]
});
