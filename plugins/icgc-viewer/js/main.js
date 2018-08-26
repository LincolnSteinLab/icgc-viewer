define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'JBrowse/Plugin',
        'dijit/MenuItem',
        './View/ICGCDonorDialog',
        './View/ICGCSSMDialog'
       ],
       function(
            declare,
            lang,
            JBrowsePlugin,
            MenuItem,
            ICGCDonorDialog,
            ICGCSSMDialog
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
                this.browser.addGlobalMenuItem('file', new MenuItem(
                    {
                        label: 'ICGC Search SSMs',
                        iconClass: "dijitIconSearch",
                        onClick: lang.hitch(this, 'createAllSSmTrack')
                    }));
            }, this);
        },

        createDonorTrack: function () {
            var searchDialog = new ICGCDonorDialog();
            searchDialog.show(this.browser,
                function () {

                });
        },
        createAllSSmTrack: function () {
            var searchDialog = new ICGCSSMDialog();
            searchDialog.show(this.browser,
                function () {

                });
        }
    });
});
