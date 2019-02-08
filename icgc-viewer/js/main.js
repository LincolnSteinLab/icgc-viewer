define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'JBrowse/Plugin',
        'dijit/MenuItem',
        './View/ICGCDialog',
        'require'
       ],
       function(
            declare,
            lang,
            JBrowsePlugin,
            MenuItem,
            ICGCDialog,
            require
       ) {
return declare(JBrowsePlugin, {
        constructor: function () {
            this.browser.afterMilestone('initView', function () {
                this.browser.addGlobalMenuItem('icgc', new MenuItem(
                    {
                        label: 'Search ICGC',
                        iconClass: "dijitIconSearch",
                        onClick: lang.hitch(this, 'createICGCTrack')
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
        }
    });
});
