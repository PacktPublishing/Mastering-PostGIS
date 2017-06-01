//Disable some of the JSLint warnings
/*global window,console,Ext,mh*/
(function(){
    //Make sure strict mode is on
    'use strict';

    /**
     * Created by info_000 on 10-Dec-16.
     */
    Ext.define('pgRouting.view.main.Main', {
        extend: 'Ext.Container',

    requires: [
        'Ext.button.Button',
        'Ext.container.Container',
        'Ext.layout.container.Anchor',
        'Ext.layout.container.Border',
        'Ext.layout.container.Fit',
        'Ext.layout.container.VBox',
        'Ext.panel.Panel',
        'Ext.toolbar.Separator',
        'Ext.toolbar.Toolbar',
        'pgRouting.view.main.MainController'
    ],

    xtype: 'app-main',

        controller: 'app-main',

        layout: 'border',

        items: [
            {
                xtype: 'panel',
                iconCls: 'x-fa fa-navicon',
                title: 'Layer Manager',
                region: 'east',
                border: true,
                width: 450,
                split: true,
                collapsible: true,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                items: [
                    {
                        xtype: 'panel',
                        layout: 'anchor',
                        bodyPadding: 10,
                        reference: 'layers',
                        defaults: {
                            anchor: '100%'
                        }
                    },
                    {
                        xtype: 'panel',
                        reference: 'lastQuery',
                        iconCls: 'x-fa fa-code',
                        title: 'Last pgRouting query',
                        flex: 1,
                        scrollable: 'y',
                        bodyPadding: 10
                    }
                ]
            },
            {
                xtype: 'panel',
                region: 'center',
                title: 'pgRouting - ol3 Map',
                iconCls: 'x-fa fa-map',
                reference: 'mapContainer',
                border: true,
                dockedItems: [
                    {
                        xtype: 'toolbar',
                        dock: 'left',
                        items: [
                            {
                                xtype: 'button',
                                toggleGroup: 'tools',
                                reference: 'add_sp',
                                allowDepress: true,
                                iconCls: 'x-fa fa-map-pin start-point',
                                tooltip: '<b>Add start point</b><br/>Adds a start point for the route calculation',
                                listeners: {
                                    toggle: 'onBtnActionToggle'
                                }
                            },
                            {
                                xtype: 'button',
                                toggleGroup: 'tools',
                                reference: 'add_ep',
                                allowDepress: true,
                                iconCls: 'x-fa fa-map-pin end-point',
                                tooltip: '<b>Add end point</b><br/>Adds an end point for the route calculation',
                                listeners: {
                                    toggle: 'onBtnActionToggle'
                                }
                            },
                            {
                                xtype: 'button',
                                allowDepress: true,
                                iconCls: 'x-fa fa-map-signs',
                                tooltip: '<b>Calculate route</b><br/>Calculates route',
                                listeners: {
                                    click: 'onBtnCalculateRouteClick'
                                }
                            },
                            {
                                xtype: 'button',
                                allowDepress: true,
                                iconCls: 'x-fa fa-remove',
                                tooltip: '<b>Clear route</b><br/>Clear route',
                                listeners: {
                                    click: 'onBtnClearRouteClick'
                                }
                            },
                            '-',
                            {
                                xtype: 'button',
                                toggleGroup: 'tools',
                                reference: 'add_dtz',
                                allowDepress: true,
                                iconCls: 'x-fa fa-bullseye',
                                tooltip: '<b>Generate drive time zone</b><br/>Click on a map to set a start point for a drive time zone',
                                listeners: {
                                    toggle: 'onBtnActionToggle'
                                }
                            },
                            {
                                xtype: 'button',
                                iconCls: 'x-fa fa-remove',
                                tooltip: '<b>Clear drive time zones</b><br/>Click to clear all the drive time zones',
                                listeners: {
                                    click: 'onBtnDeleteDtzClick'
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    });

}());