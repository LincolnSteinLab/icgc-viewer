define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/layout/AccordionContainer',
    'dijit/layout/ContentPane',
    './ICGCCommonFacetDialog'
],
function (
    declare,
    dom,
    Button,
    CheckBox,
    AccordionContainer,
    ContentPane,
    ICGCCommonFacetDialog
) {
    return declare(ICGCCommonFacetDialog, {
        accordionCount: 0,
        accordion: undefined,

        constructor: function () {
        },

        _dialogContent: function () {
            var thisB = this;
            var container = dom.create('div', { className: 'dialog-container', style: { width: '800px', height: '800px' } });

            // Create header section
            dom.create('img', {
                src: 'https://icgc.org/files/ICGC_Logo_int_small.jpg',
                width: '100'
            }, container);

            dom.create('h2', { className: '', innerHTML: 'Search for Genes'}, container);
            var infoText = 'Search for genes by filters and display all matching genes as a track.';
            dom.create('p', { innerHTML: infoText}, container);

            // Create search by facet section
            var facetUrl = thisB.createFacetUrl();
            var clearFacetButton = new Button({
                label: "Clear",
                iconClass: "dijitIconDelete",
                onClick: function() {
                    thisB.clearFacets()
                }
            }, "clearFacets").placeAt(container);
            thisB.searchByFacetContainer = dom.create('div', { className: "flexHolder" }, container);
            thisB.fetchFacets(facetUrl);

            thisB.resize();
            return container;
        },

        /**
         * Adds an Gene track along with according to the selected filters
         */
        addGeneTrack: function () {
            var thisB = this;
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'icgc-viewer/Store/SeqFeature/icgcGenes',
                filters: JSON.parse(thisB.convertFiltersObjectToString('gene'))
            };
            var storeName = this.browser.addStoreConfig(null, storeConf);

            var randomId = Math.random().toString(36).substring(7);
            var trackConf = {
                type: 'JBrowse/View/Track/CanvasVariants',
                store: storeName,
                label: "ICGC_Genes_" + randomId
            };
            trackConf.store = storeName;
            this.browser.publish('/jbrowse/v1/v/tracks/new', [trackConf]);
            this.browser.publish('/jbrowse/v1/v/tracks/show', [trackConf]);
        },

        /**
         * Retrieve facets and display
         * @param {*} facetUrl Url of facets to query
         */
        fetchFacets: function(facetUrl) {
            var thisB = this;
            
            dom.create('span', { className: '', innerHTML: 'Fetching...' }, thisB.searchByFacetContainer);
            fetch(facetUrl).then(function (facetsResponse) {
                facetsResponse.json().then(function (facetsJsonResponse) {
                        dom.empty(thisB.searchByFacetContainer);
                        if (!facetsJsonResponse.code) {
                            var tempDiv = dom.create('div', { id: thisB.accordionCount, className: "facet-accordion" }, thisB.searchByFacetContainer);

                            thisB.accordion = new AccordionContainer({ style:"height: 500px;overflow: scroll;" }, tempDiv);
                            for (var facet in facetsJsonResponse.facets) {
                                var contentPane = new ContentPane({
                                    title: thisB.camelCaseToTitleCase(facet)
                                });

                                var facetHolder = dom.create('span', { className: "flex-column" });
                                if (facetsJsonResponse.facets[facet].terms) {
                                    facetsJsonResponse.facets[facet].terms.forEach((term) => {
                                        var facetCheckbox = dom.create('span', { className: "flex-row" }, facetHolder)

                                        var checkBox = new CheckBox({
                                            name: facet + '-' + term.term,
                                            id: facet + '-' + term.term + '-' + thisB.accordionCount,
                                            value: { "facet": facet, "term" : term.term },
                                            checked: thisB.isChecked(facet, term.term),
                                            onChange: function(isChecked) {
                                                if (isChecked) {
                                                    thisB.addToFilters(this.value);
                                                } else {
                                                    thisB.removeFromFilters(this.value);
                                                }
                                                thisB.updateAccordion();
                                            }
                                        }, 'checkbox').placeAt(facetCheckbox);
                                        var label = dom.create("label", { "for" : facet + '-' + term.term + '-' + thisB.accordionCount, innerHTML: term.term + ' (' + term.count + ')' }, facetCheckbox);
                                    });
                                }

                                dojo.place(facetHolder, contentPane.containerNode);
                                thisB.accordion.addChild(contentPane);
                            }

                            thisB.accordion.startup();
                        }


                        var searchResults = dom.create('div', { id: thisB.accordionCount, className: "search-results-holder" }, thisB.searchByFacetContainer);

                        if (Object.keys(thisB.filters).length > 0) {
                            var facetStringHolder = dom.create('div', { id: thisB.accordionCount }, searchResults);
                            thisB.prettyPrintFilters(facetStringHolder);
                        }

                        dom.create('div', { innerHTML: 'Genes found: ' + facetsJsonResponse.pagination.total }, searchResults);

                        var addGenesButton = new Button({
                            label: "Add Genes",
                            iconClass: "dijitIconSave",
                            onClick: function() {
                                thisB.addGeneTrack()
                            }
                        }, "addGenes").placeAt(searchResults);

                        thisB.resize();
                    }, function (res3) {
                        console.error('error', res3);
                    });
                }, function (err) {
                    console.error('error', err);
                });
        },

        /**
         * Creates the URL for retrieving facets, including the current filters
         */
        createFacetUrl: function() {
            var thisB = this;
            return encodeURI('https://dcc.icgc.org/api/v1/genes?include=facets&facetsOnly=true&filters=' + thisB.convertFiltersObjectToString('gene'));
        }

    });
});