define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/layout/TabContainer',
    'dijit/layout/AccordionContainer',
    'dijit/layout/ContentPane',
    'dojo/aspect',
    'JBrowse/View/Dialog/WithActionBar'
],
function (
    declare,
    dom,
    focus,
    Button,
    CheckBox,
    TabContainer,
    AccordionContainer,
    ContentPane,
    aspect,
    ActionBarDialog
) {
    return declare(ActionBarDialog, {
        facetAndResultsHolder: undefined,
        facetTabHolder: undefined,
        searchResultsTabHolder: undefined,

        facetTabs: undefined,
        donorFacetTab: undefined,
        geneFacetTab: undefined,
        mutationFacetTab: undefined,

        resultsTabs: undefined,
        donorResultsTab: undefined,
        geneResultstTab: undefined,
        mutationResultsTab: undefined,

        donorAccordion: undefined,
        geneAccordion: undefined,
        mutationAccordion: undefined,

        accordionCount: 0,

        donorFilters: {},
        mutationFilters: {},
        geneFilters: {},

        constructor: function() {
            var thisB = this;

            aspect.after(this, 'hide', function () {
                focus.curNode && focus.curNode.blur();
                setTimeout(function () { thisB.destroyRecursive(); }, 500);
            });
        },
        
        _dialogContent: function () {
            var thisB = this;
            var container = dom.create('div', { className: 'dialog-container', style: { width: '1000px', height: '600px' } });

            // Create header section
            dom.create('img', {
                src: 'https://icgc.org/files/ICGC_Logo_int_small.jpg',
                width: '100'
            }, container);

            // Create the scaffolding to hold everything
            thisB.createScaffolding(container);

            // Create the facets
            thisB.createAccordions();

            thisB.resize();
            return container;
        },

        createAccordions: function() {
            var thisB = this;
            thisB.donorAccordion = new AccordionContainer({ id: 'accordion_donor' + '_' + thisB.accordionCount, style:"height: 500px;overflow: scroll;" }, thisB.donorFacetTab.containerNode);
            thisB.createFacet('donor', thisB.donorAccordion);

            thisB.mutationAccordion = new AccordionContainer({ id: 'accordion_mutation' + '_' + thisB.accordionCount, style:"height: 500px;overflow: scroll;" }, thisB.mutationFacetTab.containerNode);
            thisB.createFacet('mutation', thisB.mutationAccordion);

            thisB.geneAccordion = new AccordionContainer({ id: 'accordion_gene' + '_' + thisB.accordionCount, style:"height: 500px;overflow: scroll;" }, thisB.geneFacetTab.containerNode);
            thisB.createFacet('gene', thisB.geneAccordion);
        },

        destroyAccordions: function() {
            var thisB = this;
            thisB.donorAccordion.destroyDescendants();
            thisB.mutationAccordion.destroyDescendants();
            thisB.geneAccordion.destroyDescendants();
        },

        createFacetUrl: function(type) {
            var thisB = this;
            var filters = {};
            if (type === 'donor') {
                filters = thisB.donorFilters;
            } else if (type === 'mutation') {
                filters = thisB.mutationFilters;
            } else if (type === 'gene') {
                filters = thisB.geneFilters;
            }

            var facetURl = 'https://dcc.icgc.org/api/v1/' + type + 's?include=facets&filters=' + thisB.convertFiltersObjectToString(type, filters);

            return facetURl;
        },

        getFiltersForType: function(type) {
            var thisB = this;
            var filters = {};
            if (type === 'donor') {
                filters = thisB.donorFilters;
            } else if (type === 'mutation') {
                filters = thisB.mutationFilters;
            } else if (type === 'gene') {
                filters = thisB.geneFilters;
            }
            return filters;
        },

        createFacet: function(type, accordion) {
            var thisB = this;

            var url = thisB.createFacetUrl(type);
            console.log(url);
            fetch(url).then(function (facetsResponse) {
                facetsResponse.json().then(function (facetsJsonResponse) {
                        if (!facetsJsonResponse.code) {
                            console.log(facetsJsonResponse);
                            // Create accordion of the facets available
                            for (var facet in facetsJsonResponse.facets) {
                                var contentPane = new ContentPane({
                                    title: thisB.camelCaseToTitleCase(facet),
                                    style: "height: auto"
                                });

                                var facetHolder = dom.create('span', { className: "flex-column" });
                                if (facetsJsonResponse.facets[facet].terms) {
                                    facetsJsonResponse.facets[facet].terms.forEach((term) => {
                                        var facetCheckbox = dom.create('span', { className: "flex-row" }, facetHolder)

                                        var checkBox = new CheckBox({
                                            name: facet + '-' + term.term,
                                            id: facet + '-' + term.term + '-' + type + '-' + thisB.accordionCount,
                                            value: { "facet": facet, "term" : term.term },
                                            checked: thisB.isChecked(facet, term.term, thisB.getFiltersForType(type)),
                                            onChange: function(isChecked) {
                                                if (isChecked) {
                                                    if (type === 'donor') {
                                                        thisB.donorFilters = thisB.addToFilters(this.value, thisB.donorFilters);
                                                    } else if (type === 'mutation') {
                                                        thisB.mutationFilters = thisB.addToFilters(this.value, thisB.mutationFilters);
                                                    } else if (type === 'gene') {
                                                        thisB.geneFilters = thisB.addToFilters(this.value, thisB.geneFilters);
                                                    }
                                                } else {
                                                    if (type === 'donor') {
                                                        thisB.donorFilters = thisB.removeFromFilters(this.value, thisB.donorFilters);
                                                    } else if (type === 'mutation') {
                                                        thisB.mutationFilters = thisB.removeFromFilters(this.value, thisB.mutationFilters);
                                                    } else if (type === 'gene') {
                                                        thisB.geneFilters = thisB.removeFromFilters(this.value, thisB.geneFilters);
                                                    }
                                                }
                                                console.log(thisB.donorFilters);
                                                console.log(thisB.mutationFilters);
                                                console.log(thisB.geneFilters);
                                                thisB.updateAccordion();
                                            }
                                        }, 'checkbox').placeAt(facetCheckbox);
                                        var label = dom.create("label", { "for" : facet + '-' + term.term + '-' + type + '-' + thisB.accordionCount, innerHTML: term.term + ' (' + term.count + ')' }, facetCheckbox);
                                    });
                                }

                                dojo.place(facetHolder, contentPane.containerNode);
                                accordion.addChild(contentPane);
                            }

                            accordion.startup();

                            thisB.resize();
                        }
                    }, function (res3) {
                        console.error('error', res3);
                    });
                }, function (err) {
                    console.error('error', err);
                });
        },

        createScaffolding: function(container) {
            var thisB = this;

            // Create main holder
            thisB.facetAndResultsHolder = dom.create('div', { className: 'flexHolder', style: { width: '100%', height: '100%' } }, container);

            // Create sections to hold facet tabs and search results tab
            thisB.facetTabHolder = dom.create('div', { style: { 'flex': '1 0 0'} }, thisB.facetAndResultsHolder);
            thisB.searchResultsTabHolder = dom.create('div', { style: { 'flex': '3 0 0' } }, thisB.facetAndResultsHolder);

            // Create facet tabs
            thisB.facetTabs = new TabContainer({style: "flex: 1 0 0; "}, thisB.facetTabHolder);

            thisB.donorFacetTab = new ContentPane({
                title: "Donor"
            });
            thisB.facetTabs.addChild(thisB.donorFacetTab);

            thisB.geneFacetTab = new ContentPane({
                title: "Gene"
            });
            thisB.facetTabs.addChild(thisB.geneFacetTab);

            thisB.mutationFacetTab = new ContentPane({
                title: "Mutation"
            });
            thisB.facetTabs.addChild(thisB.mutationFacetTab);

            thisB.facetTabs.startup();

            // Create results tabs
            thisB.resultsTabs = new TabContainer({style: "flex: 3 0 0; "}, thisB.searchResultsTabHolder);

            thisB.donorResultsTab = new ContentPane({
                title: "Donor"
            });
            thisB.resultsTabs.addChild(thisB.donorResultsTab);

            thisB.geneResultsTab = new ContentPane({
                title: "Gene"
            });
            thisB.resultsTabs.addChild(thisB.geneResultsTab);
            
            thisB.mutationResultsTab = new ContentPane({
                title: "Mutation"
            });
            thisB.resultsTabs.addChild(thisB.mutationResultsTab);

            thisB.resultsTabs.startup();
        },

        addToFilters: function(value, filters) {
            facet = value.facet;
            term = value.term;
            if (!filters[facet]) {
                filters[facet] = [];
            }
            if (filters[facet].indexOf(term) == -1) {
                filters[facet].push(term);
            }
            return filters;
        },

        removeFromFilters: function(value, filters) {
            facet = value.facet;
            term = value.term;
            if (filters[facet]) {
                var index = filters[facet].indexOf(term);
                if (index > -1) {
                    filters[facet].splice(index, 1);
                }
                if (filters[facet].length === 0) {
                    delete filters[facet];
                }
            }
            return filters;
        },

        isChecked: function(facet, term, filters) {
            return filters[facet] && filters[facet].indexOf(term) > -1;
        },

        updateAccordion: function() {
            var thisB = this;
            thisB.destroyAccordions();
            thisB.accordionCount = thisB.accordionCount + 1;
            thisB.createAccordions();
        },

        convertFiltersObjectToString: function(type, filters) {
            if (Object.keys(filters).length === 0) {
                return JSON.stringify(filters);
            }
            var filterObject = {};
            filterObject[type] = {};

            for (var facet in filters) {
                var facetObject = { "is": filters[facet] };
                filterObject[type][facet] = facetObject;
            }
            return JSON.stringify(filterObject);
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