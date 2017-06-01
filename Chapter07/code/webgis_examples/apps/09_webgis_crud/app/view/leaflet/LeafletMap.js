//Disable some of the JSLint warnings
/*global window,console,Ext,mh*/
(function(){
    //Make sure strict mode is on
    'use strict';

    /**
     * Created by info_000 on 23-Nov-16.
     */
    Ext.define('WebGIS.view.leaflet.LeafletMap', {
        extend: 'Ext.Container',
        xtype: 'leafletmap',

    requires: [
        'Ext.button.Button',
        'Ext.form.FieldSet',
        'Ext.layout.container.Anchor',
        'Ext.layout.container.Border',
        'Ext.layout.container.Fit',
        'Ext.panel.Panel',
        'Ext.toolbar.Separator',
        'Ext.toolbar.Toolbar',
        'WebGIS.view.leaflet.LeafletMapController'
    ],

    controller: 'leafletmap',



        layout: 'border',

        items: [
            {
                xtype: 'panel',
                region: 'east',
                iconCls: 'x-fa fa-navicon',
                title: 'Layer Manager',
                border: true,
                width: 300,
                split: true,
                collapsible: true,
                layout: 'anchor',
                bodyPadding: 10,
                reference: 'layers',
                defaults: {
                    anchor: '100%'
                }
            },
            {
                xtype: 'panel',
                region: 'center',
                border: true,
                title: 'Leaflet Map',
                iconCls: 'x-fa fa-map',
                reference: 'mapContainer',
                dockedItems: [
                    {
                        xtype: 'toolbar',
                        dock: 'left',
                        items: [
                            {
                                xtype: 'button',
                                toggleGroup: 'edit_btns',
                                allowDepress: true,
                                iconCls: 'x-fa fa-plus',
                                tooltip: '<b>New feature</b><br/>Adds new feature',
                                listeners: {
                                    toggle: 'onBtnAddToggle'
                                }
                            },
                            {
                                xtype: 'button',
                                toggleGroup: 'edit_btns',
                                allowDepress: true,
                                iconCls: 'x-fa fa-edit',
                                tooltip: '<b>Edit feature</b><br/>Select a feature to toggle its editability',
                                listeners: {
                                    click: 'onBtnEditToggle'
                                }
                            },
                            {
                                xtype: 'button',
                                toggleGroup: 'edit_btns',
                                allowDepress: true,
                                iconCls: 'x-fa fa-remove',
                                tooltip: '<b>Delete feature</b><br/>Select a feature to delete it',
                                listeners: {
                                    toggle: 'onBtnDeleteToggle'
                                }
                            },
                            '-',
                            {
                                xtype: 'button',
                                toggleGroup: 'edit_btns',
                                allowDepress: true,
                                iconCls: 'x-fa fa-bullseye',
                                tooltip: '<b>Buffer feature</b><br/>Select a feature to create buffers',
                                listeners: {
                                    toggle: 'onBtnBufferToggle'
                                }
                            },
                            {
                                xtype: 'button',
                                iconCls: 'x-fa fa-remove',
                                tooltip: '<b>Delete buffers</b><br/>Click to delete all buffers',
                                listeners: {
                                    click: 'onBtnDeleteBuffersClick'
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    });

}());