define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/dom-construct',
    'dojo/aspect',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/form/TextBox',
    'dojo/on',
    'dojo/query',
    'JBrowse/View/Dialog/WithActionBar'
],
function (
    declare,
    array,
    dom,
    aspect,
    focus,
    Button,
    TextBox,
    on,
    query,
    ActionBarDialog
) {
    return declare(ActionBarDialog, {

        constructor: function () {
            var thisB = this;
            aspect.after(this, 'hide', function () {
                focus.curNode && focus.curNode.blur();
                setTimeout(function () { thisB.destroyRecursive(); }, 500);
            });
        },

        _dialogContent: function () {
            var content = this.content = {};
            var container = dom.create('div', { className: 'search-container' });
            var searchBoxDiv = dom.create('div', { className: 'section' }, container);

            // Create search box with label
            dom.create('span', { className: 'header', innerHTML: 'Enter a Donor ID' }, searchBoxDiv);
            content.searchBox = new TextBox({}).placeAt(searchBoxDiv);
            var x = dom.create('div', { style: { width: '500px' } }, container);

            var thisB = this;
            var searchText = "";

            // OnClick will add a track with the given donor ID
            var myButton = new Button({
                label: "Add donor track",
                iconClass: "dijitIconSearch",
                onClick: function() {
                    thisB.addTrack(searchText);
                }
            }, "addButton").placeAt(searchBoxDiv);

            thisB.resize();

            // Update the search text on change
            on(content.searchBox, 'change', function () {
                searchText = content.searchBox.get('value');
            });

            return container;
        },

        addTrack: function (val) {
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'icgc-viewer/Store/SeqFeature/icgcDonorMutations',
                donor: val
            };
            var storeName = this.browser.addStoreConfig(null, storeConf);

            var trackConf = {
                type: 'JBrowse/View/Track/CanvasVariants',
                store: storeName,
                label: "ICGC_Donor_" + val
            };
            trackConf.store = storeName;
            this.browser.publish('/jbrowse/v1/v/tracks/new', [trackConf]);
            this.browser.publish('/jbrowse/v1/v/tracks/show', [trackConf]);
        },

        show: function (browser, callback) {
            this.browser = browser;
            this.callback = callback || function () {};
            this.set('title', 'ICGC Browser');
            this.set('content', this._dialogContent());
            this.inherited(arguments);
            focus.focus(this.closeButtonNode);
        }

    });
});