define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'JBrowse/Plugin',
        'dijit/MenuItem',
        './View/ICGCDonorDialog',
        './View/ICGCSSMDialog',
        './View/ICGCGeneDialog',
        './View/ICGCDialog'
       ],
       function(
            declare,
            lang,
            JBrowsePlugin,
            MenuItem,
            ICGCDonorDialog,
            ICGCSSMDialog,
            ICGCGeneDialog,
            ICGCDialog
       ) {
return declare(JBrowsePlugin, {
        constructor: function () {
            this.browser.afterMilestone('initView', function () {
                this.browser.addGlobalMenuItem('icgc', new MenuItem(
                    {
                        label: 'Search for Donors',
                        iconClass: "dijitIconSearch",
                        onClick: lang.hitch(this, 'createDonorTrack')
                    }));
                this.browser.addGlobalMenuItem('icgc', new MenuItem(
                    {
                        label: 'Search for Mutations',
                        iconClass: "dijitIconSearch",
                        onClick: lang.hitch(this, 'createAllSSmTrack')
                    }));
                this.browser.addGlobalMenuItem('icgc', new MenuItem(
                    {
                        label: 'Search for Genes',
                        iconClass: "dijitIconSearch",
                        onClick: lang.hitch(this, 'createGeneTrack')
                    }));
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
            var searchDialog = new ICGCDialog();
            searchDialog.show(this.browser,
                function () {

                });
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
