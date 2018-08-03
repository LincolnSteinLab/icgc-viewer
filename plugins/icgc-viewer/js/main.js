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
                        label: 'ICGC Search for donor',
                        iconClass: "dijitIconSearch",
                        onClick: lang.hitch(this, 'createDonorTrack')
                    }));
            }, this);
        },

        createDonorTrack: function () {
            var searchDialog = new ICGCDialog();
            searchDialog.show(this.browser,
                function () {

                });
        }
    });
});
