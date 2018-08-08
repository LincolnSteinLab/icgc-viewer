define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dojo/aspect',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/form/TextBox',
    'dojo/on',
    'JBrowse/View/Dialog/WithActionBar'
],
function (
    declare,
    dom,
    aspect,
    focus,
    Button,
    TextBox,
    on,
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

            // Add the logo
            dom.create('img', {
                src: 'https://icgc.org/files/ICGC_Logo_int_small.jpg',
                width: '100'
            }, container);

            // Create search box with label
            var searchBoxDiv = dom.create('div', { className: 'section' }, container);
            dom.create('span', { className: 'header', innerHTML: 'Enter a Donor ID: ' }, searchBoxDiv);
            content.searchBox = new TextBox({}).placeAt(searchBoxDiv);
            var searchResults = dom.create('div', { style: { width: '500px' } }, container);

            var thisB = this;

            // OnClick will add a track with the given donor ID
            var myButton = new Button({
                iconClass: "dijitIconSearch",
                onClick: function() {
                    thisB.searchForDonor(searchResults)
                }
            }, "addButton").placeAt(searchBoxDiv);

            thisB.resize();

            // Update the search text on change
            on(content.searchBox, 'change', function () {
                thisB.searchText = content.searchBox.get('value');
            });

            return container;
        },

        searchForDonor: function(searchResults) {
            var thisB = this;
            fetch('https://dcc.icgc.org/api/v1/donors/' + thisB.searchText).then(function (res) {
                    res.json().then(function (res2) {
                        if (!res2.code) {
                            dom.empty(searchResults);

                            // Add some basic donor information
                            dom.create('h1', { className: '', innerHTML: 'Donor ' + res2.id }, searchResults);
                            dom.create('p', { className: '', innerHTML: res2.projectName + ' (' + res2.projectId + ')' }, searchResults);
                            dom.create('p', { className: '', innerHTML: res2.gender + '/' + res2.vitalStatus }, searchResults);
                            dom.create('p', { className: '', innerHTML: res2.primarySite + '/' + res2.tumourType + '/' + res2.tumourSubtype }, searchResults);

                            // Add button to the container
                            if (res2.availableDataTypes.includes("ssm")) {
                                dom.create('span', { className: '', innerHTML: 'Simple Somatic Mutations (SSMs)' }, searchResults);
                                var ssmButton = new Button({
                                    label: "Add",
                                    iconClass: "dijitIconSave",
                                    onClick: function() {
                                        thisB.addSSMTrack(thisB.searchText);
                                    }
                                }, "ssmButton").placeAt(searchResults);
                            }

                        } else {
                            dom.empty(searchResults);
                            dom.create('span', { className: '', innerHTML: 'No donors found with ID ' + thisB.searchText }, searchResults);
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
                type: 'icgc-viewer/Store/SeqFeature/icgcSimpleSomaticMutations',
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