define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dojo/aspect',
    'dojo/query',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/form/TextBox',
    'dijit/form/CheckBox',
    'dijit/layout/AccordionContainer',
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
    CheckBox,
    AccordionContainer,
    ContentPane,
    on,
    ActionBarDialog
) {
    return declare(ActionBarDialog, {
        // Keep track of facet -> [filters]
        // Then generate these each time
        // Will make it easier to update
        filters: {},
        containerHolder: undefined,
        accordionCount: 0,
        constructor: function () {
            var thisB = this;
            aspect.after(this, 'hide', function () {
                focus.curNode && focus.curNode.blur();
                setTimeout(function () { thisB.destroyRecursive(); }, 500);
            });
        },

        _dialogContent: function () {
            var thisB = this;
            var container = dom.create('div', { className: 'dialog-container', style: { width: '500px' } });

            // Add the logo
            dom.create('img', {
                src: 'https://icgc.org/files/ICGC_Logo_int_small.jpg',
                width: '100'
            }, container);

            var facetUrl = thisB.createFacetUrl();

            thisB.containerHolder = dom.create('div', { }, container);

            thisB.fetchFacets(facetUrl);

            var myButton = new Button({
                iconClass: "dijitIconSearch",
                onClick: function() {
                    thisB.addSSMTrack()
                }
            }, "addMutations").placeAt(container);

            thisB.resize();
            return container;
        },

        addSSMTrack: function () {
            var thisB = this;
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'icgc-viewer/Store/SeqFeature/icgcSimpleSomaticMutations',
                filters: thisB.convertFiltersObjectToString()
            };
            var storeName = this.browser.addStoreConfig(null, storeConf);

            var trackConf = {
                type: 'JBrowse/View/Track/CanvasVariants',
                store: storeName,
                label: "ICGC_SSM"
            };
            trackConf.store = storeName;
            this.browser.publish('/jbrowse/v1/v/tracks/new', [trackConf]);
            this.browser.publish('/jbrowse/v1/v/tracks/show', [trackConf]);
        },

        // Check if the term is found in the given facet
        isChecked: function(facet, term) {
            var thisB = this;
            return thisB.filters[facet] && thisB.filters[facet].indexOf(term) > -1;
        },

        fetchFacets: function(facetUrl) {
            var thisB = this;
            
            dom.create('span', { className: '', innerHTML: 'Fetching...' }, thisB.containerHolder);
            fetch(facetUrl).then(function (facetsResponse) {
                facetsResponse.json().then(function (facetsJsonResponse) {
                        dom.empty(thisB.containerHolder);
                        if (!facetsJsonResponse.code) {
                            dom.create('span', { className: '', innerHTML: 'Mutations: ' + facetsJsonResponse.pagination.total }, thisB.containerHolder);
                            var tempDiv = dom.create('div', { id: thisB.accordionCount }, thisB.containerHolder);

                            var accordion = new AccordionContainer({ style:"height: 400px;overflow: scroll;" }, tempDiv);
                            for (var facet in facetsJsonResponse.facets) {
                                // Create accordion pane
                                var contentPane = new ContentPane({
                                    title: facet
                                });

                                // Create an object with all facets
                                if (facetsJsonResponse.facets[facet].terms) {
                                    var facetHolder = dom.create('span', { style:"display: flex; flex-direction:column" });
                                    facetsJsonResponse.facets[facet].terms.forEach((term) => {
                                        var facetCheckbox = dom.create('span', { style:"display: flex; flex-direction:row" }, facetHolder)

                                        var checkBox = new CheckBox({
                                            name: facet + '-' + term.term,
                                            id: facet + '-' + term.term + '-' + thisB.accordionCount,
                                            value: [facet, term.term],
                                            checked: thisB.isChecked(facet, term.term),
                                            onChange: function(b) {
                                                if (b) {
                                                    // Add filter
                                                    thisB.addToFilters(this.value);
                                                } else {
                                                    // Remove filter (this doesn't seem to work)
                                                    thisB.removeFromFilters(this.value);
                                                }
                                                accordion.destroyRecursive();
                                                dom.empty(thisB.containerHolder);
                                                thisB.accordionCount = thisB.accordionCount + 1;
                                                thisB.fetchFacets(thisB.createFacetUrl());
                                            }
                                        }, 'checkbox').placeAt(facetCheckbox);
                                        var label = dom.create("label", { "for" : facet + '-' + term.term + '-' + thisB.accordionCount, innerHTML: term.term + ' (' + term.count + ')' }, facetCheckbox);
                                    });
                                    // Place facets in accordion pane
                                    dojo.place(facetHolder, contentPane.containerNode);

                                    // Add accordion pane to facet
                                    accordion.addChild(contentPane);
                                }
                            }

                            accordion.startup();
                        }
                        thisB.resize();
                    }, function (res3) {
                        console.error('error', res3);
                    });
                }, function (err) {
                    console.error('error', err);
                });
        },

        // Converts the filters object to an ICGC compatable string
        convertFiltersObjectToString: function() {
            var thisB = this;
            if (Object.keys(thisB.filters).length === 0) {
                return JSON.stringify(thisB.filters);
            }
            var filterObject = { "mutation" : { }};
            for (var facet in thisB.filters) {
                var facetObject = { "is": thisB.filters[facet] };
                filterObject.mutation[facet] = facetObject;
            }
            return JSON.stringify(filterObject);
        },

        createFacetUrl: function() {
            var thisB = this;
            return encodeURI('https://dcc.icgc.org/api/v1/mutations?include=facets&facetsOnly=true&filters=' + thisB.convertFiltersObjectToString());
        },

        // Adds the facet and term to the filters object
        addToFilters: function(value) {
            facet = value[0];
            term = value[1];
            var thisB = this;
            if (!thisB.filters[facet]) {
                thisB.filters[facet] = [];
            }
            if (thisB.filters[facet].indexOf(term) == -1) {
                thisB.filters[facet].push(term);
            }
        },

        // Removes the term from the facet in the filters object
        removeFromFilters: function(value) {
            facet = value[0];
            term = value[1];
            var thisB = this;

            if (thisB.filters[facet]) {
                var index = thisB.filters[facet].indexOf(term);
                if (index > -1) {
                    thisB.filters[facet].splice(index, 1);
                }
                if (thisB.filters[facet].length === 0) {
                    thisB.filters[facet] = undefined;
                }
            }
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