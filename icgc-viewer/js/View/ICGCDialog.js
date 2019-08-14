/**
 * A Dialog for complex searches on the ICGC using faceted search
 */
define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/layout/TabContainer',
    'dijit/layout/AccordionContainer',
    'dijit/layout/ContentPane',
    'dijit/Menu',
    'dijit/MenuItem',
    'dijit/form/ComboButton',
    './BaseICGCDialog'
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
    Menu,
    MenuItem,
    ComboButton,
    BaseICGCDialog
) {
    return declare(BaseICGCDialog, {
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
        
        /**
         * Create a DOM object containing ICGC primary site interface
         * @return {object} DOM object
         */
        _dialogContent: function () {
            var thisB = this;
            var container = dom.create('div', { className: 'dialog-container', style: { width: '1200px', height: '700px' } });

            // Unique ID for accordion
            thisB.accordionId = thisB.guid();

            // Create header section
            thisB.createHeaderSection(container);

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
         * Add a header section with a logo and title
         * @param {object} container DOM object to place header
         */
        createHeaderSection: function(container) {
            var headerSection = dom.create('div', { style: "display: flex; flex-direction: row; justify-content: flex-start; align-items: center;" }, container);
            var logoSection = dom.create('div', { style: "flex-grow: 2" }, headerSection);

            dom.create('img', {
                src: 'https://icgc.org/files/ICGC_Logo_int_small.jpg',
                width: '154px',
                height: '59px'
            }, logoSection);

            var titleSection = dom.create('div', { style: "flex-grow: 7" }, headerSection);
            var aboutMessage = dom.create('h1', { innerHTML: "Explore data available on the ICGC Data Portal" }, titleSection);
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
                thisB.createFacet(type, thisB.donorAccordion, loadingIcon);
            } else if (type === 'mutation') {
                thisB.mutationAccordion = new AccordionContainer({ id: newAccordionId, className: "accordionContainer" }, thisB.mutationFacetTab.containerNode);
                var loadingIcon = thisB.createLoadingIcon(thisB.mutationFacetTab.containerNode);
                thisB.createFacet(type, thisB.mutationAccordion, loadingIcon);
            } else if (type === 'gene') {
                thisB.geneAccordion = new AccordionContainer({ id: newAccordionId, className: "accordionContainer" }, thisB.geneFacetTab.containerNode);
                var loadingIcon = thisB.createLoadingIcon(thisB.geneFacetTab.containerNode);
                thisB.createFacet(type, thisB.geneAccordion, loadingIcon);
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
         * @return {string} URL for facets
         */
        createFacetUrl: function(type) {
            var thisB = this;
            var facetUrl = 'https://dcc.icgc.org/api/v1/' + type + 's?include=facets&filters=' + thisB.createCombinedFacets();
            return facetUrl;
        },

        /**
         * Retrieves the filters of some type
         * @param {string} type The type of accordion
         * @return {object} filters of the given type
         */
        getFiltersForType: function(type) {
            var thisB = this;
            if (type === 'donor') {
                return thisB.donorFilters;
            } else if (type === 'mutation') {
                return thisB.mutationFilters;
            } else if (type === 'gene') {
                return thisB.geneFilters;
            }
        },

        /**
         * Compare function used for sorting facets
         * @param {*} a Object with a string field called 'term'
         * @param {*} b Object with a string field called 'term'
         */
        compareTermElements: function(a, b) {
            if (a.term < b.term) {
                return -1;
            } else if (a.term > b.term) {
                return 1;
            } else {
                return 0;
            }
        },

        /**
         * Creates a facet accordion of some type and places them in the given accordion
         * @param {string} type The type of accordion
         * @param {AccordionContainer} accordion The accordion to put the facets in
         * @param {object} loadingIcon The loading element
         */
        createFacet: function(type, accordion, loadingIcon) {
            var thisB = this;

            // Create a facet URL will all currently selected filters applied
            var url = thisB.createFacetUrl(type);

            // Fetch facets and display in accordion
            fetch(url).then(function (facetsResponse) {
                dom.empty(loadingIcon);

                facetsResponse.json().then(function (facetsJsonResponse) {
                    // Response will have a code if errored
                    if (!facetsJsonResponse.code) {
                        // Create accordion of the facets available
                        for (var facet in facetsJsonResponse.facets) {
                            if (facet != 'projectName') {
                                var paneId = facet + '-' + type + '-' + thisB.accordionId;
                                var contentPane = new ContentPane({
                                    title: thisB.camelCaseToTitleCase(facet),
                                    style: "height: auto",
                                    id: paneId
                                });

                                var facetHolder = dom.create('span', { className: "flex-column", style: "width: 100%" });
                                if (!facetsJsonResponse.facets[facet].terms || facetsJsonResponse.facets[facet].terms.length == 0) {
                                    dom.create('span', { className: "flex-row", innerHTML: "No terms for the selected facet." }, facetHolder)
                                }
                                if (facetsJsonResponse.facets[facet].terms) {
                                    facetsJsonResponse.facets[facet].terms.sort(thisB.compareTermElements);
                                    facetsJsonResponse.facets[facet].terms.forEach((term) => {
                                        var facetCheckbox = dom.create('span', { className: "flex-row" }, facetHolder)
                                        var checkboxName = facet + '-' + term.term;
                                        var checkboxId = facet + '-' + term.term + '-' + type + '-' + thisB.accordionId;
                                        var checkBox = new CheckBox({
                                            name: checkboxName,
                                            id: checkboxId,
                                            value: { "facet": facet, "term" : term.term, "type": type },
                                            checked: thisB.isChecked(facet, term.term, thisB.getFiltersForType(type)),
                                            onChange: function(isChecked) {
                                                // Update the selected facets based on selection
                                                if (isChecked) {
                                                    if (this.value.type === 'donor') {
                                                        thisB.donorFilters = thisB.addToFilters(this.value, thisB.donorFilters);
                                                    } else if (this.value.type === 'mutation') {
                                                        thisB.mutationFilters = thisB.addToFilters(this.value, thisB.mutationFilters);
                                                    } else if (this.value.type === 'gene') {
                                                        thisB.geneFilters = thisB.addToFilters(this.value, thisB.geneFilters);
                                                    }
                                                } else {
                                                    if (this.value.type === 'donor') {
                                                        thisB.donorFilters = thisB.removeFromFilters(this.value, thisB.donorFilters);
                                                    } else if (this.value.type === 'mutation') {
                                                        thisB.mutationFilters = thisB.removeFromFilters(this.value, thisB.mutationFilters);
                                                    } else if (this.value.type === 'gene') {
                                                        thisB.geneFilters = thisB.removeFromFilters(this.value, thisB.geneFilters);
                                                    }
                                                }
                                                
                                                // Update with newly applied filter
                                                for (var type of thisB.types) {
                                                    thisB.updateAccordion(type);
                                                    thisB.updateSearchResults(type);
                                                }
                                            }
                                        }, 'checkbox').placeAt(facetCheckbox);
                                        
                                        // Add text label to checkbox
                                        var labelName = facet + '-' + term.term + '-' + type + '-' + thisB.accordionId;
                                        var labelContent = term.term + ' (' + (term.count).toLocaleString() + ')';
                                        dom.create("label", { "for" : labelName, innerHTML: labelContent }, facetCheckbox);
                                    });
                                }

                                // Place facet group into holder and add to accordion
                                dojo.place(facetHolder, contentPane.containerNode);
                                accordion.addChild(contentPane);
                            }
                        }

                        // Update accordion with new content
                        accordion.startup();
                        accordion.resize();
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
                thisB.addTooltipToButton(clearFacetButton, "Clears all facets");
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
                                if (facetsJsonResponse.pagination.from && facetsJsonResponse.pagination.count && facetsJsonResponse.pagination.total) {
                                    var endResult = facetsJsonResponse.pagination.from + facetsJsonResponse.pagination.count - 1;
                                    var resultsInfo = dom.create('div', { innerHTML: "Showing " + (facetsJsonResponse.pagination.from).toLocaleString() + " to " + endResult.toLocaleString() + " of " + (facetsJsonResponse.pagination.total).toLocaleString() }, thisB.donorResultsTab.containerNode);
                                    thisB.createDonorsTable(facetsJsonResponse.hits, thisB.donorResultsTab.containerNode, combinedFacetObject);
                                    thisB.createPaginationButtons(thisB.donorResultsTab.containerNode, facetsJsonResponse.pagination, type, thisB.donorPage);
                                } else {
                                    var resultsInfo = dom.create('div', { innerHTML: "No results for the selected facets." }, thisB.donorResultsTab.containerNode);
                                }
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
                                if (facetsJsonResponse.pagination.from && facetsJsonResponse.pagination.count && facetsJsonResponse.pagination.total) {
                                    var ssmMenu = new Menu({ style: "display: none;"});
                                    var menuItemSSMFiltered = new MenuItem({
                                        label: "Filtered SSMs form ICGC",
                                        iconClass: "dijitIconNewTask",
                                        onClick: function() {
                                            thisB.addTrack('SimpleSomaticMutations', undefined, combinedFacetObject, 'icgc-viewer/View/Track/SSMTrack');
                                            alert("Adding track with all SSMs from the ICGC, with current filters applied");
                                        }
                                    });
                                    ssmMenu.addChild(menuItemSSMFiltered);
                                    ssmMenu.startup();

                                    var buttonAllSSMs = new ComboButton({
                                        label: "All SSMs from ICGC",
                                        iconClass: "dijitIconNewTask",
                                        dropDown: ssmMenu,
                                        onClick: function() {
                                            thisB.addTrack('SimpleSomaticMutations', undefined, undefined, 'icgc-viewer/View/Track/SSMTrack');
                                            alert("Add track with all SSMs from the ICGC");
                                        }
                                    });
                                    buttonAllSSMs.placeAt(thisB.mutationResultsTab.containerNode);
                                    buttonAllSSMs.startup();
                                    thisB.addTooltipToButton(menuItemSSMFiltered, "Add track with all SSMs from the ICGC, with current filters applied");
                                    thisB.addTooltipToButton(buttonAllSSMs, "Add track with all SSMs from the ICGC");

                                    var endResult = facetsJsonResponse.pagination.from + facetsJsonResponse.pagination.count - 1;
                                    var resultsInfo = dom.create('div', { innerHTML: "Showing " + (facetsJsonResponse.pagination.from).toLocaleString() + " to " + endResult.toLocaleString() + " of " + (facetsJsonResponse.pagination.total).toLocaleString() }, thisB.mutationResultsTab.containerNode);
                            
                                    thisB.createMutationsTable(facetsJsonResponse.hits, thisB.mutationResultsTab.containerNode, combinedFacetObject);
                                    thisB.createPaginationButtons(thisB.mutationResultsTab.containerNode, facetsJsonResponse.pagination, type, thisB.mutationPage);
                                } else {
                                    var resultsInfo = dom.create('div', { innerHTML: "No results for the selected facets." }, thisB.mutationResultsTab.containerNode);
                                }
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
                                if (facetsJsonResponse.pagination.from && facetsJsonResponse.pagination.count && facetsJsonResponse.pagination.total) {
                                    var geneMenu = new Menu({ style: "display: none;"});
                                    var menuItemGeneFiltered = new MenuItem({
                                        label: "Filtered Genes from ICGC",
                                        iconClass: "dijitIconNewTask",
                                        onClick: function() {
                                            thisB.addTrack('Genes', undefined, combinedFacetObject, 'icgc-viewer/View/Track/GeneTrack');
                                            alert("Adding track with all genes from the ICGC, with current filters applied");
                                        }
                                    });
                                    geneMenu.addChild(menuItemGeneFiltered);
                                    geneMenu.startup();

                                    var buttonAllGenes = new ComboButton({
                                        label: "All Genes from ICGC",
                                        iconClass: "dijitIconNewTask",
                                        dropDown: geneMenu,
                                        style: "padding-right: 8px;",
                                        onClick: function() {
                                            thisB.addTrack('Genes', undefined, undefined, 'icgc-viewer/View/Track/GeneTrack');
                                            alert("Adding track with all genes from the ICGC");
                                        }
                                    });
                                    buttonAllGenes.placeAt(thisB.geneResultsTab.containerNode);
                                    buttonAllGenes.startup();
                                    thisB.addTooltipToButton(menuItemGeneFiltered, "Add track with all genes from the ICGC, with current filters applied");
                                    thisB.addTooltipToButton(buttonAllGenes, "Add track with all genes from the ICGC");

                                    var endResult = facetsJsonResponse.pagination.from + facetsJsonResponse.pagination.count - 1;
                                    var resultsInfo = dom.create('div', { innerHTML: "Showing " + (facetsJsonResponse.pagination.from).toLocaleString() + " to " + endResult.toLocaleString() + " of " + (facetsJsonResponse.pagination.total).toLocaleString() }, thisB.geneResultsTab.containerNode);
                                    
                                    thisB.createGenesTable(facetsJsonResponse.hits, thisB.geneResultsTab.containerNode, combinedFacetObject);
                                    thisB.createPaginationButtons(thisB.geneResultsTab.containerNode, facetsJsonResponse.pagination, type, thisB.genePage);
                                } else {
                                    var resultsInfo = dom.create('div', { innerHTML: "No results for the selected facets." }, thisB.geneResultsTab.containerNode);
                                }
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
         * Creates the donor URL for grabbing mutations
         * @param {object} combinedFacetObject Object containing facet information
         * @return {string} donor URL
         */
        createDonorUrl: function(combinedFacetObject) {
            var thisB = this;
            return encodeURI('https://dcc.icgc.org/api/v1/donors?from=' + thisB.getStartIndex(thisB.donorPage)  + '&size=' + thisB.pageSize + '&sort=ssmAffectedGenes&filters=' + combinedFacetObject);
        },

        /**
         * Creates the gene URL for grabbing mutations
         * @param {object} combinedFacetObject Object containing facet information
         * @return {string} gene URL
         */
        createGeneUrl: function(combinedFacetObject) {
            var thisB = this;
            return encodeURI('https://dcc.icgc.org/api/v1/genes?from=' + thisB.getStartIndex(thisB.genePage) + '&size=' + thisB.pageSize + '&sort=affectedDonorCountFiltered&filters=' + combinedFacetObject);
        },

        /**
         * Creates the mutation URL for grabbing mutations
         * @param {object} combinedFacetObject Object containing facet information
         * @return {string} mutation URL
         */
        createMutationUrl: function(combinedFacetObject) {
            var thisB = this;
            return encodeURI('https://dcc.icgc.org/api/v1/mutations?from=' + thisB.getStartIndex(thisB.mutationPage) + '&size=' + thisB.pageSize + '&sort=affectedDonorCountFiltered&filters=' + combinedFacetObject);
        },

        /**
         * Calculate the 'from' parameter for the URL call
         * @param {number} page current page
         * @return {number} start index
         */
        getStartIndex: function(page) {
            var thisB = this;
            return thisB.pageSize * (page - 1) + 1;
        },

        /**
         * Combines all of the facets into one object and converts to a string
         * The result can be used with the ICGC query param 'filter='
         * @return {string} stringified version of combined filters
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
            thisB.facetTabs = new TabContainer({style: "flex: 1 0 0; padding-right: 3px; padding-top: 5px; "}, thisB.facetTabHolder);

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
            thisB.prettyFacetHolder = dom.create('div', { style: { 'flex': '3 0 0', 'margin': '5px', 'display': 'flex', 'flex-wrap': 'wrap', 'align-content': 'stretch', 'align-items': 'center' } }, thisB.searchResultsVerticalHolder);

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
         * Pretty prints the current filters, roughly matching the style on the ICGC site.
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
                    <th>Mutations</th>
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
                        <td>${(thisB.prettyString(hit.survivalTime)).toLocaleString()}</td>
                `
                var donorRowContentNode = dom.toDom(donorRowContent);

                // Create element to hold buttons
                var geneButtonNode = dom.toDom(`<td></td>`);

                var geneMenu = new Menu({ style: "display: none;"});
                var menuItemGeneFiltered = new MenuItem({
                    label: "Filtered Genes for Donor",
                    iconClass: "dijitIconNewTask",
                    onClick: (function(hit, combinedFacetObject) {
                        return function() {
                            thisB.addTrack('Genes', hit.id, combinedFacetObject, 'icgc-viewer/View/Track/GeneTrack');
                            alert("Adding Gene track for case " + hit.id);
                        }
                    })(hit, combinedFacetObject)
                });
                geneMenu.addChild(menuItemGeneFiltered);
                geneMenu.startup();

                var buttonAllGenes = new ComboButton({
                    label: "All Genes for Donor",
                    iconClass: "dijitIconNewTask",
                    dropDown: geneMenu,
                    onClick: (function(hit) {
                        return function() {
                            thisB.addTrack('Genes', hit.id, undefined, 'icgc-viewer/View/Track/GeneTrack');
                            alert("Adding Gene track for case " + hit.id);
                        }
                    })(hit)
                });
                buttonAllGenes.placeAt(geneButtonNode);
                buttonAllGenes.startup();
                thisB.addTooltipToButton(menuItemGeneFiltered, "Add track with all genes for the given donor, with current filters applied");
                thisB.addTooltipToButton(buttonAllGenes, "Add track with all genes for the given donor");

                // Place buttons in table
                dom.place(geneButtonNode, donorRowContentNode);

                // Create element to hold buttons
                var ssmButtonNode = dom.toDom(`<td></td>`);

                var ssmMenu = new Menu({ style: "display: none;"});
                var menuItemSsmFiltered = new MenuItem({
                    label: "Filtered SSMs for Donor",
                    iconClass: "dijitIconNewTask",
                    onClick: (function(hit, combinedFacetObject) {
                        return function() {
                            thisB.addTrack('SimpleSomaticMutations',  hit.id, combinedFacetObject, 'icgc-viewer/View/Track/SSMTrack');
                            alert("Adding Simple Somatic Mutation track for case " +  hit.id);
                        }
                    })(hit, combinedFacetObject)
                });
                ssmMenu.addChild(menuItemSsmFiltered);
                ssmMenu.startup();

                var buttonAllSsms = new ComboButton({
                    label: "All SSMs for Donor",
                    iconClass: "dijitIconNewTask",
                    dropDown: ssmMenu,
                    onClick: (function(hit) {
                        return function() {
                            thisB.addTrack('SimpleSomaticMutations',  hit.id, undefined, 'icgc-viewer/View/Track/SSMTrack');
                            alert("Adding Simple Somatic Mutation track for case " +  hit.id);
                        }
                    })(hit)
                });
                buttonAllSsms.placeAt(ssmButtonNode);
                buttonAllSsms.startup();
                thisB.addTooltipToButton(menuItemSsmFiltered, "Add track with all SSMs for the given donor, with current filters applied");
                thisB.addTooltipToButton(buttonAllSsms, "Add track with all SSMS for the given donor");

                // Place buttons in table
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
         * @param {object} location DOM element to place the table
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
         * @param {object} location DOM element to place the table
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
         * @param {object} holder DOM location to place buttons
         * @param {object} pagination pagination object returned from ICGC
         * @param {string} type page type
         * @param {number} pageNum current page number
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
         * @param {boolean} noFilters Whether or not to apply filters
         * @param {string} text button label
         */
        createDonorButtons: function(donorId, availableDataTypes, holder, combinedFacetObject, noFilters, text) {
            var thisB = this;
            if (noFilters) {
                combinedFacetObject = undefined;
            }
            if (availableDataTypes.includes("ssm")) {
                var ssmButton = new Button({
                    iconClass: "dijitIconNewTask",
                    label: text,
                    onClick: function() {
                        thisB.addTrack('SimpleSomaticMutations', donorId, combinedFacetObject, 'icgc-viewer/View/Track/SSMTrack');
                        alert("Adding Simple Somatic Mutations track for the donor " + donorId);
                    }
                }, "ssmButton").placeAt(holder);
            }
        },

        /**
         * Create a button to add a donor gene button that will create a gene track based on the given
         * donor ID and facet object
         * @param {string} donorId Id of donor
         * @param {object} holder Div to place the button in
         * @param {object} combinedFacetObject combined object of facets
         * @param {boolean} noFilters Whether or not to apply filters
         * @param {string} text button label
         */
        createDonorGeneButton: function(donorId, holder, combinedFacetObject, noFilters, text) {
            var thisB = this;
            if (noFilters) {
                combinedFacetObject = undefined;
            }
            var geneButton = new Button({
                iconClass: "dijitIconNewTask",
                label: text,
                onClick: function() {
                    thisB.addTrack('Genes', donorId, combinedFacetObject, 'icgc-viewer/View/Track/GeneTrack');
                    alert("Adding Genes track for the donor " + donorId);
                }
            }, "geneButton").placeAt(holder);
        },

        /**
         * Generic function for adding a track of some type
         * @param {*} storeClass the JBrowse store class
         * @param {*} donorId unique ICGC ID of donor
         * @param {*} combinedFacetObject Facet object containing facets from all types
         * @param {*} trackType the JBrowse track type
         */
        addTrack: function (storeClass, donorId, combinedFacetObject, trackType) {
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'icgc-viewer/Store/SeqFeature/' + storeClass,
                donor: donorId,
                filters: combinedFacetObject
            };
            var storeName = this.browser.addStoreConfig(null, storeConf);
            var randomId = Math.random().toString(36).substring(7);

            var key = 'ICGC_' + storeClass;
            var label = key + '_' + randomId;

            if (donorId != null && donorId != undefined) {
                key += '_' + donorId
                label += '_' + donorId
            }

            var trackConf = {
                type: trackType,
                store: storeName,
                label: label,
                key: key,
                metadata: {
                    datatype: storeClass,
                    donor: donorId
                },
                unsafePopup: true,
                menuTemplate : [ 
                    {   
                     label : "View details",
                   }
               ]
            };

            if (storeClass === 'Genes') {
                trackConf.fmtDetailValue_annotations = function(value) { return "<div id='annotations-icgc-" + value +  "'>Loading content...</div" };
                trackConf.menuTemplate.push(
                    {   
                        label : "Highlight this Gene",
                    },
                    {
                        label : "View Gene on ICGC",
                        iconClass : "dijitIconSearch",
                        action: "newWindow",
                        url : function(track, feature) { return "https://dcc.icgc.org/genes/" + feature.get('about')['id'] }
                    }
                );
            } else if (storeClass === 'SimpleSomaticMutations') {
                trackConf.fmtDetailValue_projects = function(value) { return "<div id='projects-icgc-" + value +  "'>Loading content...</div" };
                trackConf.menuTemplate.push(
                    {   
                        label : "Highlight this Simple Somatic Mutation",
                    },
                    {
                        label : "View SSM on ICGC",
                        iconClass : "dijitIconSearch",
                        action: "newWindow",
                        url : function(track, feature) { return "https://dcc.icgc.org/mutations/" + feature.get('about')['id'] }
                    }
                );
            }

            console.log("Adding track of type " + trackType + " and store class " + storeClass + ": " + key + " (" + label + ")");

            trackConf.store = storeName;
            this.browser.publish('/jbrowse/v1/v/tracks/new', [trackConf]);
            this.browser.publish('/jbrowse/v1/v/tracks/show', [trackConf]);
        },

        /**
         * Makes a string pretty (N/A if does not exist)
         * @param {string}  value String to pretty
         * @return {string} pretty value
         */
        prettyString: function(value) {
            return value ? value : "N/A";
        },

        /**
         * Adds the facet and term to the filters object and returns
         * @param {string} value object holding facet and term to add
         * @param {object} filters filters object to add to
         * @return {object} filters with object added
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
         * @return {object} filters with object removed
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
         * @return {string} stringified version of filter object
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
         * @return {string} word in title case
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
         * Show callback for displaying dialog
         * @param {*} browser 
         * @param {*} callback 
         */
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