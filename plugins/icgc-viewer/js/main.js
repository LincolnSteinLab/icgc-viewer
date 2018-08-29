define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'JBrowse/Plugin',
        'dijit/MenuItem',
        './View/ICGCDonorDialog',
        './View/ICGCSSMDialog',
        './View/ICGCGeneDialog'
       ],
       function(
            declare,
            lang,
            JBrowsePlugin,
            MenuItem,
            ICGCDonorDialog,
            ICGCSSMDialog,
            ICGCGeneDialog
       ) {
return declare(JBrowsePlugin, {
        constructor: function () {
            this.browser.afterMilestone('initView', function () {
                this.browser.addGlobalMenuItem('file', new MenuItem(
                    {
                        label: 'ICGC Search Donors',
                        iconClass: "dijitIconSearch",
                        onClick: lang.hitch(this, 'createDonorTrack')
                    }));
                this.browser.addGlobalMenuItem('file', new MenuItem(
                    {
                        label: 'ICGC Search Mutations',
                        iconClass: "dijitIconSearch",
                        onClick: lang.hitch(this, 'createAllSSmTrack')
                    }));
                this.browser.addGlobalMenuItem('file', new MenuItem(
                    {
                        label: 'ICGC Search Genes',
                        iconClass: "dijitIconSearch",
                        onClick: lang.hitch(this, 'createGeneTrack')
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
        },
        createGeneTrack: function () {
            var searchDialog = new ICGCGeneDialog();
            searchDialog.show(this.browser,
                function () {

                });
        }
    });
});
