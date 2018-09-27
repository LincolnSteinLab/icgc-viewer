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
        // Backbone of the Dialog structure
        facetAndResultsHolder: undefined,
        facetTabHolder: undefined,
        searchResultsTabHolder: undefined,
        searchResultsVerticalHolder: undefined,
        prettyFacetHolder: undefined,

        // Tab holder and tabs for facets
        facetTabs: undefined,
        donorFacetTab: undefined,
        geneFacetTab: undefined,
        mutationFacetTab: undefined,

        // Tab holder and tabs for results
        resultsTabs: undefined,
        donorResultsTab: undefined,
        geneResultsTab: undefined,
        mutationResultsTab: undefined,

        // Accordion for facets
        donorAccordion: undefined,
        geneAccordion: undefined,
        mutationAccordion: undefined,
        accordionId: 0,

        // Selected filter objects
        donorFilters: {},
        mutationFilters: {},
        geneFilters: {},

        // Pagination variables
        donorPage: 1,
        mutationPage: 1,
        genePage: 1,
        pageSize: 20,

        // Available types
        types: ['donor', 'mutation', 'gene'],

        constructor: function() {
            var thisB = this;

            aspect.after(this, 'hide', function () {
                focus.curNode && focus.curNode.blur();
                setTimeout(function () { thisB.destroyRecursive(); }, 500);
            });
        },
        
        _dialogContent: function () {
            var thisB = this;
            var container = dom.create('div', { className: 'dialog-container', style: { width: '1000px', height: '700px' } });

            // Unique ID for accordion
            thisB.accordionId = thisB.guid();

            // Create header section
            dom.create('img', {
                src: 'https://icgc.org/files/ICGC_Logo_int_small.jpg',
                width: '100'
            }, container);

            // Create the scaffolding to hold everything
            thisB.createScaffolding(container);

            // Create initial accordions and search results
            for (var type of thisB.types) {
                thisB.createAccordions(type);
                thisB.updateSearchResults(type);
            }

            thisB.resize();
            return container;
        },

        /**
         * Creates an accordion of the given type
         * @param {string} type The type of accordion
         */
        createAccordions: function(type) {
            var thisB = this;
            var newAccordionId = 'accordion_' + type + '_' + thisB.accordionId;

            if (type === 'donor') {
                thisB.donorAccordion = new AccordionContainer({ id: newAccordionId, className: "accordionContainer" }, thisB.donorFacetTab.containerNode);
                var loadingIcon = thisB.createLoadingIcon(thisB.donorFacetTab.containerNode);
                thisB.createFacet('donor', thisB.donorAccordion, loadingIcon);
            } else if (type === 'mutation') {
                thisB.mutationAccordion = new AccordionContainer({ id: newAccordionId, className: "accordionContainer" }, thisB.mutationFacetTab.containerNode);
                var loadingIcon = thisB.createLoadingIcon(thisB.mutationFacetTab.containerNode);
                thisB.createFacet('mutation', thisB.mutationAccordion, loadingIcon);
            } else if (type === 'gene') {
                thisB.geneAccordion = new AccordionContainer({ id: newAccordionId, className: "accordionContainer" }, thisB.geneFacetTab.containerNode);
                var loadingIcon = thisB.createLoadingIcon(thisB.geneFacetTab.containerNode);
                thisB.createFacet('gene', thisB.geneAccordion, loadingIcon);
            }
        },

        /**
         * Destroys an accordion of the given type
         * @param {string} type The type of accordion
         */
        destroyAccordions: function(type) {
            var thisB = this;
            if (type === 'donor') {
                thisB.donorAccordion.destroyDescendants();
            } else if (type === 'mutation') {
                thisB.mutationAccordion.destroyDescendants();
            } else if (type === 'gene') {
                thisB.geneAccordion.destroyDescendants();
            }
        },

        /**
         * Creates a facet URL based on some type
         * @param {string} type The type of accordion
         */
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

        /**
         * Retrieves the filters of some type
         * @param {string} type The type of accordion
         */
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

        /**
         * Creates a facet accordion of some type and places them in the given accordion
         * @param {string} type The type of accordion
         * @param {AccordionContainer} accordion The accordion to put the facets in
         */
        createFacet: function(type, accordion, loadingIcon) {
            var thisB = this;

            var url = thisB.createFacetUrl(type);
            fetch(url).then(function (facetsResponse) {
                dom.empty(loadingIcon);
                facetsResponse.json().then(function (facetsJsonResponse) {
                        if (!facetsJsonResponse.code) {
                            // Create accordion of the facets available
                            for (var facet in facetsJsonResponse.facets) {
                                var contentPane = new ContentPane({
                                    title: thisB.camelCaseToTitleCase(facet),
                                    style: "height: auto",
                                    id: facet + '-' + type + '-' + thisB.accordionId
                                });

                                var facetHolder = dom.create('span', { className: "flex-column" });
                                if (facetsJsonResponse.facets[facet].terms) {
                                    facetsJsonResponse.facets[facet].terms.forEach((term) => {
                                        var facetCheckbox = dom.create('span', { className: "flex-row" }, facetHolder)

                                        var checkBox = new CheckBox({
                                            name: facet + '-' + term.term,
                                            id: facet + '-' + term.term + '-' + type + '-' + thisB.accordionId,
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
                                                thisB.updateAccordion(type);
                                                for (var type of thisB.types) {
                                                    thisB.updateSearchResults(type);
                                                }
                                            }
                                        }, 'checkbox').placeAt(facetCheckbox);
                                        var label = dom.create("label", { "for" : facet + '-' + term.term + '-' + type + '-' + thisB.accordionId, innerHTML: term.term + ' (' + term.count + ')' }, facetCheckbox);
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

        /**
         * Updates the search results of some type based on the facets
         * @param {string} type The type of accordion
         */
        updateSearchResults: function(type) {
            var thisB = this;
            var combinedFacetObject = thisB.createCombinedFacets();
            dom.empty(thisB.prettyFacetHolder);

            if (Object.keys(thisB.donorFilters).length + Object.keys(thisB.mutationFilters).length + Object.keys(thisB.geneFilters).length > 0) {
                var clearFacetButton = new Button({
                    iconClass: "dijitIconDelete",
                    onClick: function() {
                        thisB.clearFacets()
                    }
                }, "clearFacets").placeAt(thisB.prettyFacetHolder);
            }

            var combinedFacets = Object.assign({}, thisB.donorFilters, thisB.mutationFilters, thisB.geneFilters);
            thisB.prettyPrintFilters(thisB.prettyFacetHolder, combinedFacets);

            if (type === 'donor') {
                dom.empty(thisB.donorResultsTab.containerNode);
                var resultsInfo = thisB.createLoadingIcon(thisB.donorResultsTab.containerNode);

                var donorUrl = thisB.createDonorUrl(combinedFacetObject);
                fetch(donorUrl).then(function (facetsResponse) {
                    dom.empty(resultsInfo);
                    facetsResponse.json().then(function (facetsJsonResponse) {
                            if (!facetsJsonResponse.code) {
                                var endResult = facetsJsonResponse.pagination.from + facetsJsonResponse.pagination.count;
                                var resultsInfo = dom.create('div', { innerHTML: "Showing " + facetsJsonResponse.pagination.from + " to " + endResult + " of " + facetsJsonResponse.pagination.total }, thisB.donorResultsTab.containerNode);
                                thisB.createDonorsTable(facetsJsonResponse.hits, thisB.donorResultsTab.containerNode, combinedFacetObject);
                                thisB.createPaginationButtons(thisB.donorResultsTab.containerNode, facetsJsonResponse.pagination, type, thisB.donorPage);
                            }
                        }, function (res3) {
                            console.error('error', res3);
                        });
                    }, function (err) {
                        console.error('error', err);
                    });
            } else if (type === 'mutation') {
                dom.empty(thisB.mutationResultsTab.containerNode);
                var resultsInfo = thisB.createLoadingIcon(thisB.mutationResultsTab.containerNode);

                var mutationUrl = thisB.createMutationUrl(combinedFacetObject);
                fetch(mutationUrl).then(function (facetsResponse) {
                    dom.empty(resultsInfo);
                    facetsResponse.json().then(function (facetsJsonResponse) {
                            if (!facetsJsonResponse.code) {
                                var addMutationsButton = new Button({
                                    label: "Add All SSMs",
                                    iconClass: "dijitIconSave",
                                    onClick: function() {
                                        thisB.addSSMTrack(combinedFacetObject)
                                    }
                                }, "addMutations").placeAt(thisB.mutationResultsTab.containerNode);

                                var endResult = facetsJsonResponse.pagination.from + facetsJsonResponse.pagination.count;
                                var resultsInfo = dom.create('div', { innerHTML: "Showing " + facetsJsonResponse.pagination.from + " to " + endResult + " of " + facetsJsonResponse.pagination.total }, thisB.mutationResultsTab.containerNode);
                           
                                thisB.createMutationsTable(facetsJsonResponse.hits, thisB.mutationResultsTab.containerNode, combinedFacetObject);
                                thisB.createPaginationButtons(thisB.mutationResultsTab.containerNode, facetsJsonResponse.pagination, type, thisB.mutationPage);
                            }
                        }, function (res3) {
                            console.error('error', res3);
                        });
                    }, function (err) {
                        console.error('error', err);
                    });
            } else if (type === 'gene') {
                dom.empty(thisB.geneResultsTab.containerNode);
                var resultsInfo = thisB.createLoadingIcon(thisB.geneResultsTab.containerNode);
                
                var geneUrl = thisB.createGeneUrl(combinedFacetObject);
                fetch(geneUrl).then(function (facetsResponse) {
                    dom.empty(resultsInfo);
                    facetsResponse.json().then(function (facetsJsonResponse) {
                            if (!facetsJsonResponse.code) {
                                var addGenesButton = new Button({
                                    label: "Add All Genes",
                                    iconClass: "dijitIconSave",
                                    onClick: function() {
                                        thisB.addGeneTrack(combinedFacetObject)
                                    }
                                }, "addGenes").placeAt(thisB.geneResultsTab.containerNode);

                                var endResult = facetsJsonResponse.pagination.from + facetsJsonResponse.pagination.count;
                                var resultsInfo = dom.create('div', { innerHTML: "Showing " + facetsJsonResponse.pagination.from + " to " + endResult + " of " + facetsJsonResponse.pagination.total }, thisB.geneResultsTab.containerNode);
                                
                                thisB.createGenesTable(facetsJsonResponse.hits, thisB.geneResultsTab.containerNode, combinedFacetObject);
                                thisB.createPaginationButtons(thisB.geneResultsTab.containerNode, facetsJsonResponse.pagination, type, thisB.genePage);
                            }
                        }, function (res3) {
                            console.error('error', res3);
                        });
                    }, function (err) {
                        console.error('error', err);
                    });
            }
        },

        /**
         * Creates a loading icon in the given location and returns
         * @param {object} location Place to put the loading icon
         */
        createLoadingIcon: function(location) {
            var loadingIcon = dom.create('div', { className: 'loading-icgc' }, location);
            var spinner = dom.create('div', {}, loadingIcon);
            return loadingIcon;
        },

        /**
         * Creates the donor URL for grabbing mutations
         * @param {object} combinedFacetObject Object containing facet information
         */
        createDonorUrl: function(combinedFacetObject) {
            var thisB = this;
            return encodeURI('https://dcc.icgc.org/api/v1/donors?from=' + thisB.getStartIndex(thisB.donorPage)  + '&size=' + thisB.pageSize + '&sort=ssmAffectedGenes&filters=' + combinedFacetObject);
        },

        /**
         * Creates the gene URL for grabbing mutations
         * @param {object} combinedFacetObject Object containing facet information
         */
        createGeneUrl: function(combinedFacetObject) {
            var thisB = this;
            return encodeURI('https://dcc.icgc.org/api/v1/genes?from=' + thisB.getStartIndex(thisB.genePage) + '&size=' + thisB.pageSize + '&sort=affectedDonorCountFiltered&filters=' + combinedFacetObject);
        },

        /**
         * Creates the mutation URL for grabbing mutations
         * @param {object} combinedFacetObject Object containing facet information
         */
        createMutationUrl: function(combinedFacetObject) {
            var thisB = this;
            return encodeURI('https://dcc.icgc.org/api/v1/mutations?from=' + thisB.getStartIndex(thisB.mutationPage) + '&size=' + thisB.pageSize + '&sort=affectedDonorCountFiltered&filters=' + combinedFacetObject);
        },

        /**
         * Calculate the 'from' parameter for the URL call
         * @param {integer} page current page
         */
        getStartIndex: function(page) {
            var thisB = this;
            return thisB.pageSize * (page - 1) + 1;
        },

        /**
         * Combines all of the facets into one object and converts to a string
         */
        createCombinedFacets: function() {
            var thisB = this;
            var donorFilter = JSON.parse(thisB.convertFiltersObjectToString('donor', thisB.donorFilters));
            var mutationFilter = JSON.parse(thisB.convertFiltersObjectToString('mutation', thisB.mutationFilters));
            var geneFilter = JSON.parse(thisB.convertFiltersObjectToString('gene', thisB.geneFilters));

            var combinedFilters = Object.assign({}, donorFilter, mutationFilter, geneFilter);
            return JSON.stringify(combinedFilters);
        },

        /**
         * Creates the scaffolding to place all of the accordions and search results in
         * @param {object} container Location to place the scaffolding in
         */
        createScaffolding: function(container) {
            var thisB = this;

            // Create main holder
            thisB.facetAndResultsHolder = dom.create('div', { className: 'flexHolder', style: { width: '100%', height: '100%' } }, container);

            // Create sections to hold facet tabs and search results tab
            thisB.facetTabHolder = dom.create('div', { style: { 'flex': '1 0 0'} }, thisB.facetAndResultsHolder);
            thisB.searchResultsVerticalHolder = dom.create('div', { style: { 'flex': '3 0 0' } }, thisB.facetAndResultsHolder);

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
            thisB.prettyFacetHolder = dom.create('div', { style: { 'flex': '3 0 0', 'margin': '5px' } }, thisB.searchResultsVerticalHolder);

            thisB.searchResultsTabHolder = dom.create('div', { style: { width: '100%', height: '100%'  } }, thisB.searchResultsVerticalHolder);
            thisB.resultsTabs = new TabContainer({ style: {width: '100%', height: '100%'  } }, thisB.searchResultsTabHolder);

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

        /**
         * Pretty prints the current filters
         * @param {object} location  place to display the filters
         * @param {object} filters filters to display
         */
        prettyPrintFilters: function(location, filters) {
            var thisB = this;

            var currentFilter = 0;
            var filterCount = Object.keys(filters).length;
            var prettyFacetString = "";

            for (var facet in filters) {
                if (filters[facet]) {
                    var facetString = `<span><span class="filterName">${thisB.camelCaseToTitleCase(facet)}</span>`;
                    if (filters[facet].length > 1) {
                        facetString += ` <strong>IN [ </strong>`;
                        var filterLength = filters[facet].length;
                        filters[facet].forEach(function(value, i) {
                            facetString += `<span class="filterValue">${value}</span>`;
                            if (i < filterLength - 1) {
                                facetString += ` , `
                            }
                        });
                        facetString += `<strong> ]</strong>`;
                    } else {
                        facetString += ` <strong>IS </strong><span class="filterValue">${filters[facet]}</span>`;
                    }

                    if (currentFilter < filterCount - 1) {
                        facetString += ` <strong>AND</strong> `;
                    }
                    facetString += `</span>`;
                    prettyFacetString += facetString;
                }
                currentFilter++;
            }

            var node = dom.toDom(prettyFacetString);
            dom.place(node, location);
        },

        /**
         * Creates the donors table for the given hits in some location
         * @param {List<object>} hits array of donor hits
         * @param {object} location dom element to place the table
         * @param {object} combinedFacetObject combined object of facets
         */
        createDonorsTable: function(hits, location, combinedFacetObject) {
            var thisB = this;
            var table = `<table class="results-table"></table>`;
            var tableNode = dom.toDom(table);
            var rowsHolder = `
                <tr>
                    <th>Donor ID</th>
                    <th>Project Code</th>
                    <th>Primary Site</th>
                    <th>Gender</th>
                    <th>Age</th>
                    <th>Stage</th>
                    <th>Survival (days)</th>
                    <th>Genes</th>
                    <th>File Types</th>
                </tr>
            `;

            var rowsHolderNode = dom.toDom(rowsHolder);

            for (var hitId in hits) {
                var hit = hits[hitId];

                var donorRowContent = `
                        <td><a target="_blank"  href="https://dcc.icgc.org/donors/${thisB.prettyString(hit.id)}">${thisB.prettyString(hit.id)}</a></td>
                        <td>${thisB.prettyString(hit.projectId)}</td>
                        <td>${thisB.prettyString(hit.primarySite)}</td>
                        <td>${thisB.prettyString(hit.gender)}</td>
                        <td>${thisB.prettyString(hit.ageAtDiagnosis)}</td>
                        <td>${thisB.prettyString(hit.state)}</td>
                        <td>${thisB.prettyString(hit.survivalTime)}</td>
                `
                var donorRowContentNode = dom.toDom(donorRowContent);

                var geneButton = `<td></td>`;
                var geneButtonNode = dom.toDom(geneButton);
                thisB.createDonorGeneButton(hit.id, geneButtonNode, combinedFacetObject);

                dom.place(geneButtonNode, donorRowContentNode);

                var ssmButton = `<td></td>`;
                var ssmButtonNode = dom.toDom(ssmButton);
                thisB.createDonorButtons(hit.id, hit.availableDataTypes, ssmButtonNode, combinedFacetObject);

                dom.place(ssmButtonNode, donorRowContentNode);

                var row = `<tr></tr>`;
                var rowNodeHolder = dom.toDom(row);
                dom.place(donorRowContentNode, rowNodeHolder);
                dom.place(rowNodeHolder, rowsHolderNode);

            }
            dom.place(rowsHolderNode, tableNode);
            dom.place(tableNode, location);
        },

        /**
         * Creates the genes table for the given hits in some location
         * @param {List<object>} hits array of gene hits
         * @param {object} location dom element to place the table
         */
        createGenesTable: function(hits, location) {
            var thisB = this;
            var table = `<table class="results-table"></table>`;
            var tableNode = dom.toDom(table);
            var rowsHolder = `
                <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Type</th>
                </tr>
            `;

            var rowsHolderNode = dom.toDom(rowsHolder);

            for (var hitId in hits) {
                var hit = hits[hitId];

                var donorRowContent = `
                        <td><a target="_blank" href="https://dcc.icgc.org/genes/${thisB.prettyString(hit.id)}">${thisB.prettyString(hit.symbol)}</a></td>
                        <td>${thisB.prettyString(hit.name)}</td>
                        <td>chr${hit.chromosome}:${hit.start}-${hit.end}</td>
                        <td>${thisB.prettyString(hit.type)}</td>
                `
                var donorRowContentNode = dom.toDom(donorRowContent);

                var row = `<tr></tr>`;
                var rowNodeHolder = dom.toDom(row);
                dom.place(donorRowContentNode, rowNodeHolder);
                dom.place(rowNodeHolder, rowsHolderNode);

            }
            dom.place(rowsHolderNode, tableNode);
            dom.place(tableNode, location);
        },

        /**
         * Creates the mutations table for the given hits in some location
         * @param {List<object>} hits array of mutation hits
         * @param {object} location dom element to place the table
         */
        createMutationsTable: function(hits, location) {
            var thisB = this;
            var table = `<table class="results-table"></table>`;
            var tableNode = dom.toDom(table);
            var rowsHolder = `
                <tr>
                    <th>ID</th>
                    <th>DNA Change</th>
                    <th>Type</th>
                </tr>
            `;

            var rowsHolderNode = dom.toDom(rowsHolder);

            for (var hitId in hits) {
                var hit = hits[hitId];

                var donorRowContent = `
                        <td><a target="_blank"  href="https://dcc.icgc.org/mutations/${thisB.prettyString(hit.id)}">${thisB.prettyString(hit.id)}</a></td>
                        <td>chr${hit.chromosome}:${hit.start}${hit.mutation}</td>
                        <td>${thisB.prettyString(hit.type)}</td>
                `
                var donorRowContentNode = dom.toDom(donorRowContent);

                var row = `<tr></tr>`;
                var rowNodeHolder = dom.toDom(row);
                dom.place(donorRowContentNode, rowNodeHolder);
                dom.place(rowNodeHolder, rowsHolderNode);

            }
            dom.place(rowsHolderNode, tableNode);
            dom.place(tableNode, location);
        },

        /**
         * Creates pagination buttons for search results in the given 'holder' using the 'pagination' object from the ICGC response
         * @param {object} holder
         * @param {integer} pagination
         */
        createPaginationButtons: function(holder, pagination, type, pageNum) {
            var thisB = this;

            var paginationHolder = dom.create('div', { style:"display: flex;justify-content: center;"}, holder);
            
            if (pageNum > 1) {
                var previousButton = new Button({
                    label: "Previous",
                    onClick: function() {
                        thisB.previousPage(type);
                    }
                }, "previousButton").placeAt(paginationHolder);

            }

            if (pageNum < pagination.pages) {
                var nextButton = new Button({
                    label: "Next",
                    onClick: function() {
                        thisB.nextPage(type);
                    }
                }, "nextButton").placeAt(paginationHolder);
            }
        },

        /**
         * Loads the facet results at the previous page
         * @param {string} type Page type
         */
        previousPage: function(type) {
            var thisB = this;
            if (type === 'donor') {
                thisB.donorPage = thisB.donorPage - 1;
            } else if (type === 'mutation') {
                thisB.mutationPage = thisB.mutationPage - 1;
            } else if (type === 'gene') {
                thisB.genePage = thisB.genePage - 1;
            }
            thisB.updateSearchResults(type);
        },

        /**
         * Loads the facet results at the next page
         * @param {string} type Page type
         */
        nextPage: function(type) {
            var thisB = this;
            if (type === 'donor') {
                thisB.donorPage = thisB.donorPage + 1;
            } else if (type === 'mutation') {
                thisB.mutationPage = thisB.mutationPage + 1;
            } else if (type === 'gene') {
                thisB.genePage = thisB.genePage + 1;
            }
            thisB.updateSearchResults(type);
        },

        /**
         * Creates the donor buttons for the available data types (for now only SSM)
         * @param {string} donorId Id of the donor to add
         * @param {List<String>} availableDataTypes Array of available data types
         * @param {object} holder HTML element to place the buttons in
         * @param {object} combinedFacetObject combined object of facets
         */
        createDonorButtons: function(donorId, availableDataTypes, holder, combinedFacetObject) {
            var thisB = this;
            if (availableDataTypes.includes("ssm")) {
                var ssmButton = new Button({
                    label: "SSMs",
                    iconClass: "dijitIconSave",
                    onClick: function() {
                        thisB.addDonorSSMTrack(donorId, combinedFacetObject);
                    }
                }, "ssmButton").placeAt(holder);
            }
            if (availableDataTypes.includes("cnsm")) {
                var geneButton = new Button({
                    label: 'CNSMs',
                    iconClass: "dijitIconSave",
                    onClick: function() {
                        thisB.addDonorCNSMTrack(donorId);
                    }
                }, "geneButton").placeAt(holder);
            }
        },

        /**
         * Create a button to add a donor gene button that will create a gene track based on the given
         * donor ID and facet object
         * @param {string} donorId Id of donor
         * @param {object} holder Div to place the button in
         * @param {object} combinedFacetObject combined object of facets
         */
        createDonorGeneButton: function(donorId, holder, combinedFacetObject) {
            var thisB = this;
            var geneButton = new Button({
                iconClass: "dijitIconSave",
                onClick: function() {
                    thisB.addDonorGeneTrack(donorId, combinedFacetObject);
                }
            }, "geneButton").placeAt(holder);
        },

        /**
         * Adds a donor SSM track based on the donor ID and the chosen facets
         * @param {string} donorId Id of donor
         * @param {object} combinedFacetObject combined object of facets
         */
        addDonorSSMTrack: function(donorId, combinedFacetObject) {
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'icgc-viewer/Store/SeqFeature/icgcSimpleSomaticMutations',
                donor: donorId,
                filters: combinedFacetObject
            };
            var storeName = this.browser.addStoreConfig(null, storeConf);

            var trackConf = {
                type: 'JBrowse/View/Track/CanvasVariants',
                store: storeName,
                label: "ICGC_SSM_Donor_" + donorId
            };
            trackConf.store = storeName;
            this.browser.publish('/jbrowse/v1/v/tracks/new', [trackConf]);
            this.browser.publish('/jbrowse/v1/v/tracks/show', [trackConf]);
        },

        /**
         * Adds a gene track based on the chosen facets
         * @param {object} combinedFacetObject combined object of facets
         */
        addGeneTrack: function (combinedFacetObject) {
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'icgc-viewer/Store/SeqFeature/icgcGenes',
                filters: combinedFacetObject
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
         * Adds a gene track based on the chosen facets and donor ID
         * @param {string} donorId the id of the donor
         * @param {object} combinedFacetObject combined object of facets
         */
        addDonorGeneTrack: function (donorId, combinedFacetObject) {
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'icgc-viewer/Store/SeqFeature/icgcGenes',
                filters: combinedFacetObject,
                donor: donorId
            };
            var storeName = this.browser.addStoreConfig(null, storeConf);

            var trackConf = {
                type: 'JBrowse/View/Track/CanvasVariants',
                store: storeName,
                label: "ICGC_Genes_Donor" + donorId
            };
            trackConf.store = storeName;
            this.browser.publish('/jbrowse/v1/v/tracks/new', [trackConf]);
            this.browser.publish('/jbrowse/v1/v/tracks/show', [trackConf]);
        },

        /**
         * Adds an SSM track based on the chosen facets
         * @param {object} combinedFacetObject combined object of facets
         */
        addSSMTrack: function (combinedFacetObject) {
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'icgc-viewer/Store/SeqFeature/icgcSimpleSomaticMutations',
                filters: combinedFacetObject
            };
            var storeName = this.browser.addStoreConfig(null, storeConf);

            var randomId = Math.random().toString(36).substring(7);
            var trackConf = {
                type: 'JBrowse/View/Track/CanvasVariants',
                store: storeName,
                label: "ICGC_SSM_" + randomId
            };
            trackConf.store = storeName;
            this.browser.publish('/jbrowse/v1/v/tracks/new', [trackConf]);
            this.browser.publish('/jbrowse/v1/v/tracks/show', [trackConf]);
        },

        /**
         * Adds a CNSM track based on the donor Id
         * @param {string} donorId Id of the donor of interest
         */
        addDonorCNSMTrack: function (donorId) {
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'icgc-viewer/Store/SeqFeature/icgcCNSM',
                donor: donorId
            };
            var storeName = this.browser.addStoreConfig(null, storeConf);

            var randomId = Math.random().toString(36).substring(7);
            var trackConf = {
                type: 'JBrowse/View/Track/Wiggle/XYPlot',
                store: storeName,
                label: "ICGC_CNSM_" + donorId,
                max_score: 1,
                min_score: -1,
                bicolor_pivot: 0
            };
            trackConf.store = storeName;
            this.browser.publish('/jbrowse/v1/v/tracks/new', [trackConf]);
            this.browser.publish('/jbrowse/v1/v/tracks/show', [trackConf]);
        },

        /**
         * Makes a string pretty (N/A if does not exist)
         * @param {string}  value String to pretty
         */
        prettyString: function(value) {
            return value ? value : "N/A";
        },

        /**
         * Adds the facet and term to the filters object and returns
         * @param {string} value object holding facet and term to add
         * @param {object} filters filters object to add to
         */
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

        /**
         *  Removes the term from the facet in the filters object and returns
         * @param {string} value object holding facet and term to remove
         * @param {object} filters filters object to remove from
         */
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

        /**
         * Clears all of the facets
         */
        clearFacets: function() {
            var thisB = this;
            thisB.donorFilters = {};
            thisB.mutationFilters = {};
            thisB.geneFilters = {};
            for (var type of thisB.types) {
                thisB.updateAccordion(type);
                thisB.updateSearchResults(type);
            }
        },

        /**
         * Check if the term is found in the given facet
         * @param {string} facet name of the facet
         * @param {string} term name of option within facet
         * @param {object} filters list of filters to check
         */
        isChecked: function(facet, term, filters) {
            return filters[facet] && filters[facet].indexOf(term) > -1;
        },

        /**
         * Updates the accordion of the given type based on current facets
         * @param {string} type The type of the accordion to update
         */
        updateAccordion: function(type) {
            var thisB = this;
            thisB.destroyAccordions(type);
            thisB.accordionId = thisB.guid();
            thisB.createAccordions(type);
            thisB.donorPage = 1;
            thisB.genePage = 1;
            thisB.mutationPage = 1;
        },

        /**
         * Converts the filters object to an ICGC compatable string
         * @param {string} type Type of filter group
         * @param {object} filters List of filters
         */
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
         * @param {string} word A word in camelCase 
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
         * Generate a GUID
         */
        guid: function() {
            function s4() {
              return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
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