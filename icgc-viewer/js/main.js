define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'JBrowse/Plugin',
        'dijit/MenuItem',
        './View/ICGCDialog',
        './View/ICGCProjectDialog'
       ],
       function(
            declare,
            lang,
            JBrowsePlugin,
            MenuItem,
            ICGCDialog,
            ICGCProjectDialog
       ) {
return declare(JBrowsePlugin, {
        constructor: function () {
            this.browser.afterMilestone('initView', function () {
                this.browser.addGlobalMenuItem('icgc', new MenuItem(
                    {
                        label: 'Explore donors, genes and mutations',
                        iconClass: "dijitIconSearch",
                        onClick: lang.hitch(this, 'createICGCTrack')
                    }));
                this.browser.addGlobalMenuItem('icgc', new MenuItem(
                    {
                        label: 'Projects',
                        iconClass: "dijitIconSearch",
                        onClick: lang.hitch(this, 'createICGCProjectTrack')
                    }));
                    this.browser.renderGlobalMenu('icgc', {text: 'ICGC'}, this.browser.menuBar);
            }, this);            
        },

        createICGCTrack: function () {
            var searchDialog = new ICGCDialog(
                {
                    onHide: function() {
                        this.destroy();
                }
            }
            );
            searchDialog.show(this.browser,
                function () {

                });
        },

        createICGCProjectTrack: function () {
            var searchDialog = new ICGCProjectDialog(
                {
                    onHide: function() {
                        this.destroy();
                }
            }
            );
            searchDialog.show(this.browser,
                function () {

                });
        }
    });
});
