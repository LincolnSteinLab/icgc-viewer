define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/form/TextBox',
    'dijit/layout/TabContainer',
    'dijit/layout/AccordionContainer',
    'dijit/layout/ContentPane',
    'dojo/on',
    './ICGCCommonFacetDialog'
],
function (
    declare,
    dom,
    Button,
    CheckBox,
    TextBox,
    TabContainer,
    AccordionContainer,
    ContentPane,
    on,
    ICGCCommonFacetDialog
) {
    return declare(ICGCCommonFacetDialog, {
        searchText: "",
        tabs: undefined,
        tabDiv: undefined,
        searchByIdPane: undefined,
        searchByFacetPane: undefined,
        searchByIdContainer: undefined,
        filters: {},
        accordionCount: 0,
        accordion: undefined,
        page: 1,
        pageSize: 20,

        constructor: function () {
        },

        _dialogContent: function () {
            var thisB = this;
            var content = this.content = {};
            var container = dom.create('div', { className: 'search-container', style: { width: '900px', height: '700px' } });

            // Create header section
            dom.create('img', {
                src: 'https://icgc.org/files/ICGC_Logo_int_small.jpg',
                width: '100'
            }, container);

            dom.create('h2', { className: '', innerHTML: 'Search for Donors'}, container);

            // Create the tab structure
            thisB.tabDiv = dom.create('div', { }, container);

            thisB.tabs = new TabContainer({
                style: "height: 100%; overflow: scroll; width: 100%;"
            }, thisB.tabDiv);

            thisB.searchByFacetPane = new ContentPane({
                title: "Search By Facets",
                style: "height: auto; width: 100%;"
           });
           thisB.tabs.addChild(thisB.searchByFacetPane);

            thisB.searchByIdPane = new ContentPane({
                title: "Search By ID",
                style: "height: auto; width: 100%;"
           });
           thisB.tabs.addChild(thisB.searchByIdPane);
    
           thisB.tabs.startup();

           // Create search by ID tab
           thisB.createSearchByIdContent(content);

           on(content.searchBox, 'change', function () {
            thisB.searchText = content.searchBox.get('value');
            });

            // Create search by facet tab
            thisB.searchByFacetContainer = dom.create('div', { className: "flexHolder" });
            thisB.fetchFacets();

            var clearFacetButton = new Button({
                label: "Clear",
                iconClass: "dijitIconDelete",
                onClick: function() {
                    thisB.clearFacets()
                }
            }, "clearFacets").placeAt(thisB.searchByFacetPane.containerNode);

            thisB.resize();
            return container;
        },

        /**
         * Populates the search by ID tab with the search field
         * @param {*} content div to place the content of the tab
         */
        createSearchByIdContent: function(content) {
            var thisB = this;
            thisB.searchByIdContainer = dom.create('div', { });

            var searchBoxDiv = dom.create('div', { }, thisB.searchByIdContainer);
            dom.create('span', { className: 'header', innerHTML: 'Enter a Donor ID: ' }, searchBoxDiv);
            content.searchBox = new TextBox({
                placeholder: "Ex. DO232761"
            }).placeAt(searchBoxDiv);
            var searchResults = dom.create('div', { style: { width: '100%' } }, thisB.searchByIdContainer);

            var searchButton = new Button({
                iconClass: "dijitIconSearch",
                onClick: function() {
                    thisB.searchForDonorById(searchResults)
                }
            }, "searchButton").placeAt(searchBoxDiv);

            dojo.place(thisB.searchByIdContainer, thisB.searchByIdPane.containerNode);
        },

        /**
         * Calculate the 'from' parameter for the URL call
         */
        getDonorStartIndex: function() {
            var thisB = this;
            return thisB.pageSize * (thisB.page - 1) + 1;
        },

        /**
         * Create the facet URL taking into account the current page and the filters
         */
        createFacetUrl: function() {
            var thisB = this;
            return encodeURI('https://dcc.icgc.org/api/v1/donors?include=facets&from=' + thisB.getDonorStartIndex()  + '&size=' + thisB.pageSize + '&sort=ssmAffectedGenes&filters=' + thisB.convertFiltersObjectToString('donor'));
        },

        /**
         * Retrieves the facets and search results for the given URL and displays them
         */
        fetchFacets: function() {
            var thisB = this;

            var facetUrl = thisB.createFacetUrl();
            dom.create('span', { className: '', innerHTML: 'Fetching...' }, thisB.searchByFacetContainer);

            fetch(facetUrl).then(function (facetsResponse) {
                facetsResponse.json().then(function (facetsJsonResponse) {
                        dom.empty(thisB.searchByFacetContainer);
                        if (!facetsJsonResponse.code) {
                            // Create accordion of the facets available
                            var tempDiv = dom.create('div', { id: thisB.accordionCount, className: "facet-accordion" }, thisB.searchByFacetContainer);

                            thisB.accordion = new AccordionContainer({ style:"height: 500px;overflow: scroll;" }, tempDiv);
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

                            dojo.place(thisB.searchByFacetContainer, thisB.searchByFacetPane.containerNode);

                            // Create a list of search results based on the currents facets
                            var searchResults = dom.create('div', { className: "search-results-holder" }, thisB.searchByFacetContainer);

                            if (Object.keys(thisB.filters).length > 0) {
                                var facetStringHolder = dom.create('div', { id: thisB.accordionCount, style: "margin-bottom: 5px;" }, searchResults);
                                thisB.prettyPrintFilters(facetStringHolder);
                            }

                            var endResult = facetsJsonResponse.pagination.from + facetsJsonResponse.pagination.count;
                            var resultsInfo = dom.create('div', { innerHTML: "Showing " + facetsJsonResponse.pagination.from + " to " + endResult + " of " + facetsJsonResponse.pagination.total }, searchResults);

                            thisB.createDonorsTable(facetsJsonResponse.hits, searchResults);

                            thisB.createPaginationButtons(searchResults, facetsJsonResponse.pagination);

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
         * Creates the donors table for the given hits in some location
         * @param {*} hits array of donor hits
         * @param {*} location dom element to place the table
         */
        createDonorsTable: function(hits, location) {
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
                    <th># Mutations</th>
                    <th># Genes</th>
                    <th>SSM</th>
                </tr>
            `;

            var rowsHolderNode = dom.toDom(rowsHolder);

            for (var hitId in hits) {
                var hit = hits[hitId];

                var donorRowContent = `
                        <td>${thisB.prettyString(hit.id)}</td>
                        <td>${thisB.prettyString(hit.projectId)}</td>
                        <td>${thisB.prettyString(hit.primarySite)}</td>
                        <td>${thisB.prettyString(hit.gender)}</td>
                        <td>${thisB.prettyString(hit.ageAtDiagnosis)}</td>
                        <td>${thisB.prettyString(hit.state)}</td>
                        <td>${thisB.prettyString(hit.survivalTime)}</td>
                        <td>${thisB.prettyString(hit.ssmCount)}</td>
                        <td>${thisB.prettyString(hit.ssmAffectedGenes)}</td>
                `
                var donorRowContentNode = dom.toDom(donorRowContent);

                var ssmButton = `<td></td>`;
                var ssmButtonNode = dom.toDom(ssmButton);
                thisB.createDonorButtons(hit.id, hit.availableDataTypes, ssmButtonNode);

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
         * Creates pagination buttons for search results in the given 'holder' using the 'pagination' object from the ICGC response
         * @param {*} holder
         * @param {*} pagination
         */
        createPaginationButtons: function(holder, pagination) {
            var thisB = this;

            var paginationHolder = dom.create('div', { style:"display: flex;justify-content: center;"}, holder);
            
            if (thisB.page > 1) {
                var previousButton = new Button({
                    label: "Previous",
                    onClick: function() {
                        thisB.previousPage();
                    }
                }, "previousButton").placeAt(paginationHolder);

            }

            if (thisB.page < pagination.pages) {
                var nextButton = new Button({
                    label: "Next",
                    onClick: function() {
                        thisB.nextPage();
                    }
                }, "nextButton").placeAt(paginationHolder);
            }
        },

        /**
         * Loads the facet results at the previous page
         */
        previousPage: function() {
            var thisB = this;
            thisB.page = thisB.page - 1;
            thisB.updateAccordion();
        },
        
        /**
         * Loads the facet results at the next page
         */
        nextPage: function() {
            var thisB = this;
            thisB.page = thisB.page + 1;
            thisB.updateAccordion();
        },

        /**
         * Creates the donor buttons for the available data types (for now only SSM)
         * @param {*} donorId Id of the donor to add
         * @param {*} availableDataTypes Array of available data types
         * @param {*} holder HTML element to place the buttons in
         */
        createDonorButtons: function(donorId, availableDataTypes, holder) {
            var thisB = this;
            if (availableDataTypes.includes("ssm")) {
                var ssmButton = new Button({
                    iconClass: "dijitIconSave",
                    onClick: function() {
                        thisB.addSSMTrack(donorId);
                    }
                }, "ssmButton").placeAt(holder);
            }
        },

        /**
         * Searches for a donor of the given ID and adds the results to the dialog
         * @param {*} searchResults Location to place the search results in
         */
        searchForDonorById: function(searchResults) {
            var thisB = this;
            fetch('https://dcc.icgc.org/api/v1/donors/' + thisB.searchText).then(function (res) {
                    res.json().then(function (res2) {
                        if (!res2.code) {
                            dom.empty(searchResults);

                            dom.create('h1', { innerHTML: 'Donor ' + res2.id }, searchResults);

                            var donorInfo = `
                                <table class="results-table">
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

                            thisB.createDonorButtons(thisB.searchText, res2.availableDataTypes, searchResults);

                            thisB.updateStyles();

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

        /**
         * Adds an SSM track of the given donor ID
         * @param {*} donorID Donor ID to add
         */
        addSSMTrack: function (donorId) {
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'icgc-viewer/Store/SeqFeature/icgcSimpleSomaticMutations',
                donor: donorId
            };
            var storeName = this.browser.addStoreConfig(null, storeConf);

            var trackConf = {
                type: 'JBrowse/View/Track/CanvasVariants',
                store: storeName,
                label: "ICGC_Donor_" + donorId
            };
            trackConf.store = storeName;
            this.browser.publish('/jbrowse/v1/v/tracks/new', [trackConf]);
            this.browser.publish('/jbrowse/v1/v/tracks/show', [trackConf]);
        }

    });
});