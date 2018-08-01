define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'JBrowse/Plugin',
        'dijit/MenuItem',
        './View/ICGCDialog'
       ],
       function(
            declare,
            lang,
            JBrowsePlugin,
            MenuItem,
            ICGCDialog
       ) {
return declare(JBrowsePlugin, {
        constructor: function () {
            this.browser.afterMilestone('initView', function () {
                this.browser.addGlobalMenuItem('file', new MenuItem(
                    {
                        label: 'ICGC Browser',
                        iconClass: "dijitIconSearch",
                        onClick: lang.hitch(this, 'createSearchTrack')
                    }));
            }, this);
        },

        createSearchTrack: function () {
            var searchDialog = new ICGCDialog();
            searchDialog.show(this.browser,
                function () {

                });
        }
    });
});
