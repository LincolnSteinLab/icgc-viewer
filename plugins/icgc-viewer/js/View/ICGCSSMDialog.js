define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dojo/aspect',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/layout/AccordionContainer',
    'dijit/layout/ContentPane',
    'JBrowse/View/Dialog/WithActionBar'
],
function (
    declare,
    dom,
    aspect,
    focus,
    Button,
    CheckBox,
    AccordionContainer,
    ContentPane,
    ActionBarDialog
) {
    return declare(ActionBarDialog, {
        filters: {},
        containerHolder: undefined,
        accordionCount: 0,
        accordion: undefined,

        constructor: function () {
            var thisB = this;
            aspect.after(this, 'hide', function () {
                focus.curNode && focus.curNode.blur();
                setTimeout(function () { thisB.destroyRecursive(); }, 500);
            });
        },

        _dialogContent: function () {
            var thisB = this;
            var container = dom.create('div', { className: 'dialog-container', style: { width: '800px', height: '800px' } });

            dom.create('img', {
                src: 'https://icgc.org/files/ICGC_Logo_int_small.jpg',
                width: '100'
            }, container);

            dom.create('h2', { className: '', innerHTML: 'Search for Mutations'}, container);

            var facetUrl = thisB.createFacetUrl();

            thisB.containerHolder = dom.create('div', { style: "display: flex; flex-direction: row; flex-wrap: wrap; align-items: stretch;" }, container);

            thisB.fetchFacets(facetUrl);

            thisB.resize();
            return container;
        },

        /**
         * Clears all of the facets
         */
        clearFacets: function() {
            var thisB = this;
            thisB.filters = {};
            thisB.updateAccordion();
        },

        updateAccordion: function() {
            var thisB = this;
            thisB.accordion.destroyRecursive();
            dom.empty(thisB.containerHolder);
            thisB.accordionCount = thisB.accordionCount + 1;
            thisB.fetchFacets(thisB.createFacetUrl());
        },

        /**
         * Adds an SSM track along with according to the selected filters
         */
        addSSMTrack: function () {
            var thisB = this;
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'icgc-viewer/Store/SeqFeature/icgcSimpleSomaticMutations',
                filters: JSON.parse(thisB.convertFiltersObjectToString())
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

        /**
         * Converts a camelCase word to Title Case
         * @param {*} word in camelCase 
         */
        camelCaseToTitleCase: function(word) {
            var titleCase = '';
            for (var i = 0; i < word.length; i++) {
                var char = word.charAt(i);
                if (i === 0) {
                    titleCase += char.toUpperCase();
                } else {
                    if (char === char.toUpperCase()) {
                        titleCase += ' ';
                    }
                    titleCase += char;
                }
              }
              return titleCase;
        },

        /**
         * Check if the term is found in the given facet
         * @param {*} facet name of the facet
         * @param {*} term name of option within facet
         */
        isChecked: function(facet, term) {
            var thisB = this;
            return thisB.filters[facet] && thisB.filters[facet].indexOf(term) > -1;
        },

        /**
         * Retrieve facets and display
         * @param {*} facetUrl Url of facets to query
         */
        fetchFacets: function(facetUrl) {
            var thisB = this;
            
            dom.create('span', { className: '', innerHTML: 'Fetching...' }, thisB.containerHolder);
            fetch(facetUrl).then(function (facetsResponse) {
                facetsResponse.json().then(function (facetsJsonResponse) {
                        dom.empty(thisB.containerHolder);
                        if (!facetsJsonResponse.code) {
                            var tempDiv = dom.create('div', { id: thisB.accordionCount, style: "flex: 1 0 0;" }, thisB.containerHolder);

                            thisB.accordion = new AccordionContainer({ style:"height: 500px;overflow: scroll;" }, tempDiv);
                            for (var facet in facetsJsonResponse.facets) {
                                var contentPane = new ContentPane({
                                    title: thisB.camelCaseToTitleCase(facet)
                                });

                                if (facetsJsonResponse.facets[facet].terms) {
                                    var facetHolder = dom.create('span', { style:"display: flex; flex-direction:column" });
                                    facetsJsonResponse.facets[facet].terms.forEach((term) => {
                                        var facetCheckbox = dom.create('span', { style:"display: flex; flex-direction:row" }, facetHolder)

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

                                    dojo.place(facetHolder, contentPane.containerNode);
                                    thisB.accordion.addChild(contentPane);
                                }
                            }

                            thisB.accordion.startup();
                        }


                        var searchResults = dom.create('div', { id: thisB.accordionCount, style: "flex: 3 0 0; padding: 5px;" }, thisB.containerHolder);

                        thisB.prettyPrintFilters(searchResults);

                        dom.create('div', { innerHTML: 'Mutations found: ' + facetsJsonResponse.pagination.total }, searchResults);

                        var addMutationsButton = new Button({
                            label: "Add SSMs",
                            iconClass: "dijitIconSave",
                            onClick: function() {
                                thisB.addSSMTrack()
                            }
                        }, "addMutations").placeAt(searchResults);
            
                        var clearFacetButton = new Button({
                            label: "Clear",
                            iconClass: "dijitIconDelete",
                            onClick: function() {
                                thisB.clearFacets()
                            }
                        }, "clearFacets").placeAt(searchResults);

                        thisB.resize();
                    }, function (res3) {
                        console.error('error', res3);
                    });
                }, function (err) {
                    console.error('error', err);
                });
        },

        /**
         * Pretty prints the current filters
         */
        prettyPrintFilters: function(location) {
            var thisB = this;

            var currentFilter = 0;
            var filterCount = Object.keys(thisB.filters).length;
            var prettyFacetString = "";
            
            for (var facet in thisB.filters) {
                var facetString = `<span>${thisB.camelCaseToTitleCase(facet)}`;
                if (thisB.filters[facet].length > 1) {
                    facetString += ` <strong>IN [</strong>${thisB.filters[facet].join(', ')}<strong>]</strong>`;
                } else {
                    facetString += ` <strong>IS</strong> ${thisB.filters[facet]}`;
                }

                if (currentFilter < filterCount - 1) {
                    facetString += ` <strong>AND</strong> `;
                }
                facetString += `</span>`;
                prettyFacetString += facetString;
                currentFilter++;
            }

            var node = dom.toDom(prettyFacetString);
            dom.place(node, location);
        },

        /**
         * Converts the filters object to an ICGC compatable string
         */
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

        /**
         * 
         */
        createFacetUrl: function() {
            var thisB = this;
            return encodeURI('https://dcc.icgc.org/api/v1/mutations?include=facets&facetsOnly=true&filters=' + thisB.convertFiltersObjectToString());
        },

        /**
         * Adds the facet and term to the filters object
         * @param {*} value object holding facet and term to add
         */
        addToFilters: function(value) {
            facet = value.facet;
            term = value.term;
            var thisB = this;
            if (!thisB.filters[facet]) {
                thisB.filters[facet] = [];
            }
            if (thisB.filters[facet].indexOf(term) == -1) {
                thisB.filters[facet].push(term);
            }
        },

        /**
         *  Removes the term from the facet in the filters object
         * @param {*} value object holding facet and term to remove
         */
        removeFromFilters: function(value) {
            facet = value.facet;
            term = value.term;
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