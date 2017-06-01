Ext.define('Ol3Wfs.view.main.Main', {
    extend: 'Ext.panel.Panel',
    xtype: 'app-main',

    requires: [
        'Ext.container.Container',
        'Ext.layout.container.Fit',
        'Ol3Wfs.view.main.MainController'
    ],

    controller: 'main',

    title: 'ol3 WFS',

    layout: 'fit',

    items: [{
        xtype: 'container',
        reference: 'mapContainer'
    }]
});
