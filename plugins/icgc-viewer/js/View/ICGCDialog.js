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
        searchText: "",

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
            dom.create('img', {
                src: 'https://icgc.org/files/ICGC_Logo_int_small.jpg',
                width: '100'
            }, container);
            var searchBoxDiv = dom.create('div', { className: 'section' }, container);

            // Create search box with label
            dom.create('span', { className: 'header', innerHTML: 'Enter a Donor ID: ' }, searchBoxDiv);
            content.searchBox = new TextBox({}).placeAt(searchBoxDiv);
            var x = dom.create('div', { style: { width: '500px' } }, container);

            var thisB = this;

            // OnClick will add a track with the given donor ID
            var myButton = new Button({
                iconClass: "dijitIconSearch",
                onClick: function() {
                    thisB.searchForDonor(x)
                }
            }, "addButton").placeAt(searchBoxDiv);

            thisB.resize();

            // Update the search text on change
            on(content.searchBox, 'change', function () {
                thisB.searchText = content.searchBox.get('value');
            });

            return container;
        },

        searchForDonor: function(x) {
            var thisB = this;
            fetch('https://dcc.icgc.org/api/v1/donors/' + thisB.searchText).then(function (res) {
                    res.json().then(function (res2) {
                        if (!res2.code) {
                            // Add button to the container
                            dom.empty(x);
                            if (res2.availableDataTypes.includes("ssm")) {
                                dom.create('span', { className: '', innerHTML: 'Simple Somatic Mutations (SSMs)' }, x);
                                var ssmButton = new Button({
                                    label: "Add",
                                    iconClass: "dijitIconSave",
                                    onClick: function() {
                                        thisB.addSSMTrack(thisB.searchText);
                                    }
                                }, "ssmButton").placeAt(x);
                            }

                        } else {
                            console.log("Donor with id " + thisB.searchText + " not found.");
                            dom.empty(x);
                            dom.create('span', { className: '', innerHTML: 'No Donors found with ID ' + thisB.searchText }, x);
                        }

                        thisB.resize();
                    }, function (res3) {
                        console.error('error', res3);
                    });
                }, function (err) {
                    console.error('error', err);
                });
        },

        addSSMTrack: function (val) {
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