define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dojo/aspect',
    'dojo/query',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/form/TextBox',
    'dijit/layout/TabContainer',
    'dijit/layout/ContentPane',
    'dojo/on',
    'JBrowse/View/Dialog/WithActionBar'
],
function (
    declare,
    dom,
    aspect,
    query,
    focus,
    Button,
    TextBox,
    TabContainer,
    ContentPane,
    on,
    ActionBarDialog
) {
    return declare(ActionBarDialog, {
        searchText: "",
        tabs: undefined,
        tabDiv: undefined,
        searchByIdPane: undefined,
        searchByFacetPane: undefined,

        constructor: function () {
            var thisB = this;
            aspect.after(this, 'hide', function () {
                focus.curNode && focus.curNode.blur();
                setTimeout(function () { thisB.destroyRecursive(); }, 500);
            });
        },

        _dialogContent: function () {
            var thisB = this;
            var content = this.content = {};
            var container = dom.create('div', { className: 'search-container', style: { width: '500px' } });

            dom.create('img', {
                src: 'https://icgc.org/files/ICGC_Logo_int_small.jpg',
                width: '100'
            }, container);

            dom.create('h2', { className: '', innerHTML: 'Search for Donors'}, container);

            thisB.tabDiv = dom.create('div', { }, container);

            thisB.tabs = new TabContainer({
                style: "height: 300px;overflow: scroll; width: 100%;"
            }, thisB.tabDiv);

            thisB.searchByIdPane = new ContentPane({
                title: "Search By ID",
                style: "height: 200px; width: 100%;"
           });
           thisB.tabs.addChild(thisB.searchByIdPane);
       
           thisB.searchByFacetPane = new ContentPane({
                title: "Search By Facets",
                style: "height: 200px; width: 100%;"
           });
           thisB.tabs.addChild(thisB.searchByFacetPane);
       
           thisB.tabs.startup();

            var searchBoxDiv = dom.create('div', { className: 'section' });
            dom.create('span', { className: 'header', innerHTML: 'Enter a Donor ID: ' }, searchBoxDiv);
            content.searchBox = new TextBox({
                placeholder: "Ex. DO232761"
            }).placeAt(searchBoxDiv);
            var searchResults = dom.create('div', { style: { width: '100%' } });

            var searchButton = new Button({
                iconClass: "dijitIconSearch",
                onClick: function() {
                    thisB.searchForDonor(searchResults)
                }
            }, "addButton").placeAt(searchBoxDiv);

            dojo.place(searchBoxDiv, thisB.searchByIdPane.containerNode);
            dojo.place(searchResults, thisB.searchByIdPane.containerNode);

            thisB.resize();

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

                            dom.create('h1', { innerHTML: 'Donor ' + res2.id }, searchResults);

                            var donorInfo = `
                                <table>
                                    <tr>
                                        <td>Submitter ID</td>
                                        <td>${res2.submittedDonorId}</td>
                                    </tr>
                                    <tr>
                                        <td>Project Name</td>
                                        <td>${res2.projectName}</td>
                                    </tr>
                                    <tr>
                                        <td>Project Code</td>
                                        <td>${res2.projectId}</td>
                                    </tr>
                                    <tr>
                                        <td>Primary Site</td>
                                        <td>${res2.primarySite}</td>
                                    </tr>
                                    <tr>
                                        <td>Tumour Type</td>
                                        <td>${res2.tumourType}</td>
                                    </tr>
                                    <tr>
                                        <td>Tumour Subtype</td>
                                        <td>${res2.tumourSubtype}</td>
                                    </tr>
                                    <tr>
                                        <td>Total number of mutations</td>
                                        <td>${res2.ssmCount}</td>
                                    </tr>
                                </table>
                            `
                            var node = dom.toDom(donorInfo);
                            dom.place(node, searchResults);

                            if (res2.availableDataTypes.includes("ssm")) {
                                var ssmButton = new Button({
                                    label: "Add SSMs",
                                    iconClass: "dijitIconSave",
                                    onClick: function() {
                                        thisB.addSSMTrack(thisB.searchText);
                                    }
                                }, "ssmButton").placeAt(searchResults);
                            }

                            query("table").style({
                                'width': '100%',
                                'border': '1px solid #e6e6e6',
                                'border-collapse': 'collapse',
                                'border-spacing': '0'
                            });
                            query("td").style({
                                'border': '1px solid #e6e6e6',
                                'padding': '.2rem .4rem'
                            });
                            query("tr:nth-child(odd)").style({
                                'background-color': '#f2f2f2'
                            });

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