//Disable some of the JSLint warnings
/*global window,console,Ext,mh*/
(function(){
    //Make sure strict mode is on
    'use strict';

    /**
     * Created by info_000 on 23-Nov-16.
     */
    Ext.define('WebGIS.view.ol3.Ol3Map', {
        extend: 'Ext.Container',
    
        xtype: 'ol3map',

    requires: [
        'Ext.button.Button',
        'Ext.container.Container',
        'Ext.form.FieldSet',
        'Ext.layout.container.Anchor',
        'Ext.layout.container.Border',
        'Ext.layout.container.Fit',
        'Ext.panel.Panel',
        'Ext.toolbar.Separator',
        'Ext.toolbar.Toolbar',
        'WebGIS.view.ol3.Ol3MapController'
    ],

    controller: 'ol3map',

        layout: 'border',

        items: [
            {
                xtype: 'panel',
                iconCls: 'x-fa fa-navicon',
                title: 'Layer Manager',
                region: 'east',
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
                title: 'ol3 Map',
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