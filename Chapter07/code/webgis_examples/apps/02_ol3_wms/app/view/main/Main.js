Ext.define('Ol3Wms.view.main.Main', {
    extend: 'Ext.panel.Panel',
    xtype: 'app-main',

    requires: [
        'Ext.container.Container',
        'Ext.layout.container.Fit',
        'Ol3Wms.view.main.MainController'
    ],

    controller: 'main',

    title: 'ol3 WMS',

    layout: 'fit',

    items: [{
        xtype: 'container',
        reference: 'mapContainer'
    }]
});
