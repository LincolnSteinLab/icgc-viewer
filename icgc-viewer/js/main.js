define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'JBrowse/Plugin',
        'dijit/Menu',
        'dijit/MenuItem',
        'dijit/PopupMenuItem',
        './View/ICGCDialog',
        './View/ICGCProjectDialog',
        './View/ICGCStoreTokenDialog'
       ],
       function(
            declare,
            lang,
            JBrowsePlugin,
            Menu,
            MenuItem,
            PopupMenuItem,
            ICGCDialog,
            ICGCProjectDialog,
            ICGCStoreTokenDialog
       ) {
return declare(JBrowsePlugin, {
        constructor: function () {
            this.browser.afterMilestone('initView', function () {
                var explorationSubmenu = new Menu();
                explorationSubmenu.addChild(new MenuItem({
                    label: 'Explore donors, genes and mutations',
                    iconClass: "dijitIconSearch",
                    onClick: lang.hitch(this, 'createICGCTrack')
                }));
                explorationSubmenu.addChild(new MenuItem({
                    label: 'Explore projects',
                    iconClass: "dijitIconSearch",
                    onClick: lang.hitch(this, 'createICGCProjectTrack')
                }));
                this.browser.addGlobalMenuItem('icgc', new PopupMenuItem({
                    label: "Exploration",
                    iconClass: "dijitIconSearch",
                    popup: explorationSubmenu
                }));

                var fileSubmenu = new Menu();
                fileSubmenu.addChild(new MenuItem({
                    label: "Login",
                    iconClass: "dijitIconUsers",
                    onClick: lang.hitch(this, 'createICGCLogin')
                }));
                this.browser.addGlobalMenuItem('icgc', new PopupMenuItem({
                    label: "Repository files",
                    iconClass: "dijitIconFile",
                    popup: fileSubmenu
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
        },

        createICGCLogin: function() {
            var searchDialog = new ICGCStoreTokenDialog({
                onHide: function() {
                    this.destroy();
                }
            });
            searchDialog.show(this.browser, function(){});
        }
    });
});
