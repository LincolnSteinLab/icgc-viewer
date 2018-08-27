define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dojo/aspect',
    'dojo/query',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/form/TextBox',
    'dijit/layout/TabContainer',
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
    CheckBox,
    TextBox,
    TabContainer,
    AccordionContainer,
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
        searchByIdContainer: undefined,
        searchByFacetContainer: undefined,
        filters: {},
        accordionCount: 0,
        accordion: undefined,
        page: 1,
        pageSize: 10,

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
            var container = dom.create('div', { className: 'search-container', style: { width: '800px', height: '800px' } });

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
            thisB.searchByFacetContainer = dom.create('div', { style: "display: flex; flex-direction: row; flex-wrap: wrap; align-items: stretch;"});
            thisB.createSearchByDonorContent();

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
                    thisB.searchForDonor(searchResults)
                }
            }, "addButton").placeAt(searchBoxDiv);

            dojo.place(thisB.searchByIdContainer, thisB.searchByIdPane.containerNode);
        },

        /**
         * Clears all of the facets
         */
        clearFacets: function() {
            var thisB = this;
            thisB.filters = {};
            thisB.updateAccordion();
        },

        /**
         * Updates the accordion based on the current filters
         */
        updateAccordion: function() {
            var thisB = this;
            thisB.accordion.destroyRecursive();
            dom.empty(thisB.searchByFacetContainer);
            thisB.accordionCount = thisB.accordionCount + 1;
            thisB.createSearchByDonorContent(thisB.createFacetUrl());
        },

        /**
         * Converts the filters object to an ICGC compatable string
         */
        convertFiltersObjectToString: function() {
            var thisB = this;
            if (Object.keys(thisB.filters).length === 0) {
                return JSON.stringify(thisB.filters);
            }
            var filterObject = { "donor" : { }};
            for (var facet in thisB.filters) {
                var facetObject = { "is": thisB.filters[facet] };
                filterObject.donor[facet] = facetObject;
            }
            return JSON.stringify(filterObject);
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
            return encodeURI('https://dcc.icgc.org/api/v1/donors?include=facets&from=' + thisB.getDonorStartIndex()  + '&size=' + thisB.pageSize + '&sort=ssmAffectedGenes&filters=' + thisB.convertFiltersObjectToString());
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
         * Retrieves the facets and search results for the given URL and displays them
         */
        createSearchByDonorContent: function() {
            var thisB = this;

            var facetUrl = thisB.createFacetUrl();
            dom.create('span', { className: '', innerHTML: 'Fetching...' }, thisB.searchByFacetContainer);

            fetch(facetUrl).then(function (facetsResponse) {
                facetsResponse.json().then(function (facetsJsonResponse) {
                        dom.empty(thisB.searchByFacetContainer);
                        if (!facetsJsonResponse.code) {
                            // Create accordion of the facets available
                            var tempDiv = dom.create('div', { id: thisB.accordionCount, style: "flex: 1 0 0;" }, thisB.searchByFacetContainer);

                            thisB.accordion = new AccordionContainer({ style:"height: 500px;overflow: scroll;" }, tempDiv);
                            for (var facet in facetsJsonResponse.facets) {
                                var contentPane = new ContentPane({
                                    title: thisB.camelCaseToTitleCase(facet),
                                    style: "height: auto"
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

                            dojo.place(thisB.searchByFacetContainer, thisB.searchByFacetPane.containerNode);

                            // Create a list of search results based on the currents facets
                            var searchResults = dom.create('div', { style: "flex: 3 0 0; padding: 5px;" }, thisB.searchByFacetContainer);

                            var maxDonorIndex = thisB.getDonorStartIndex() + thisB.pageSize;
                            dom.create('span', { className: '', innerHTML: 'Showing donors ' + thisB.getDonorStartIndex() + ' to ' + maxDonorIndex  + ' of ' + facetsJsonResponse.pagination.total }, searchResults);
                            for (var hitId in facetsJsonResponse.hits) {
                                var hit = facetsJsonResponse.hits[hitId];
                                dom.create('h2', { innerHTML: "Donor " + hit.id }, searchResults);

                                var donorInfo = `
                                    <table>
                                        <tr>
                                            <td>Project Code</td>
                                            <td>${hit.projectId}</td>
                                        </tr>
                                        <tr>
                                            <td>Primary Site</td>
                                            <td>${hit.primarySite}</td>
                                        </tr>
                                        <tr>
                                            <td>Gender</td>
                                            <td>${hit.gender}</td>
                                        </tr>
                                        <tr>
                                            <td>Age at Diagnosis</td>
                                            <td>${hit.ageAtDiagnosis}</td>
                                        </tr>
                                        <tr>
                                            <td>Total number of mutations</td>
                                            <td>${hit.ssmCount}</td>
                                        </tr>
                                        <tr>
                                            <td>SSM Affected Genes</td>
                                            <td>${hit.ssmAffectedGenes}</td>
                                        </tr>
                                        <tr>
                                            <td>Total number of mutations</td>
                                            <td>${hit.ssmCount}</td>
                                        </tr>
                                    </table>
                                `
                                var node = dom.toDom(donorInfo);
                                dom.place(node, searchResults);
                                thisB.createDonorButtons(hit.id, hit.availableDataTypes, searchResults);
                            }

                            thisB.createPaginationButtons(searchResults, facetsJsonResponse.pagination);

                            // Update styles
                            thisB.updateStyles();

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
         * Creates pagination buttons for search results in the given 'holder' using the 'pagination' object from the ICGC response
         * @param {*} holder
         * @param {*} pagination
         */
        createPaginationButtons: function(holder, pagination) {
            var thisB = this;

            var paginationHolder = dom.create('div', { }, holder);
            
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
            if (availableDataTypes.includes("ssm")) {
                var ssmButton = new Button({
                    label: "Add SSMs",
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

        updateStyles: function(){
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