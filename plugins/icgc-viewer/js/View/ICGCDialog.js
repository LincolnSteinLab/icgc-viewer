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

        page: 1,
        pageSize: 20,

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
            thisB.createAccordions('donor');
            thisB.createAccordions('mutation');
            thisB.createAccordions('gene');

            thisB.updateSearchResults('donor');
            thisB.updateSearchResults('mutation');
            thisB.updateSearchResults('gene');

            thisB.resize();
            return container;
        },

        createAccordions: function(type) {
            var thisB = this;

            if (type === 'donor') {
                thisB.donorAccordion = new AccordionContainer({ id: 'accordion_donor' + '_' + thisB.accordionCount, style:"height: 500px;overflow: scroll;" }, thisB.donorFacetTab.containerNode);
                thisB.createFacet('donor', thisB.donorAccordion);
            } else if (type === 'mutation') {
                thisB.mutationAccordion = new AccordionContainer({ id: 'accordion_mutation' + '_' + thisB.accordionCount, style:"height: 500px;overflow: scroll;" }, thisB.mutationFacetTab.containerNode);
                thisB.createFacet('mutation', thisB.mutationAccordion);
            } else if (type === 'gene') {
                thisB.geneAccordion = new AccordionContainer({ id: 'accordion_gene' + '_' + thisB.accordionCount, style:"height: 500px;overflow: scroll;" }, thisB.geneFacetTab.containerNode);
                thisB.createFacet('gene', thisB.geneAccordion);
            }
        },

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
            fetch(url).then(function (facetsResponse) {
                facetsResponse.json().then(function (facetsJsonResponse) {
                        if (!facetsJsonResponse.code) {
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
                                                thisB.updateAccordion(type);
                                                thisB.updateSearchResults('donor');
                                                thisB.updateSearchResults('mutation');
                                                thisB.updateSearchResults('gene');
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

        updateSearchResults: function(type) {
            var thisB = this;
            var combinedFacetObject = thisB.createCombinedFacets();
            if (type === 'donor') {
                dom.empty(thisB.donorResultsTab.containerNode);
                thisB.prettyPrintFilters(thisB.donorResultsTab.containerNode, thisB.donorFilters);
                var donorUrl = thisB.createDonorUrl(combinedFacetObject);

                fetch(donorUrl).then(function (facetsResponse) {
                    facetsResponse.json().then(function (facetsJsonResponse) {
                            if (!facetsJsonResponse.code) {
                                var endResult = facetsJsonResponse.pagination.from + facetsJsonResponse.pagination.count;
                                var resultsInfo = dom.create('div', { innerHTML: "Showing " + facetsJsonResponse.pagination.from + " to " + endResult + " of " + facetsJsonResponse.pagination.total }, thisB.donorResultsTab.containerNode);
                                thisB.createDonorsTable(facetsJsonResponse.hits, thisB.donorResultsTab.containerNode);
                                thisB.createPaginationButtons(thisB.donorResultsTab.containerNode, facetsJsonResponse.pagination);
                            }
                        }, function (res3) {
                            console.error('error', res3);
                        });
                    }, function (err) {
                        console.error('error', err);
                    });
            } else if (type === 'mutation') {
                dom.empty(thisB.mutationResultsTab.containerNode);
                thisB.prettyPrintFilters(thisB.mutationResultsTab.containerNode, thisB.mutationFilters);

                var mutationUrl = thisB.createMutationUrl(combinedFacetObject);
                fetch(mutationUrl).then(function (facetsResponse) {
                    facetsResponse.json().then(function (facetsJsonResponse) {
                            if (!facetsJsonResponse.code) {
                                dom.create('div', { innerHTML: 'Mutations found: ' + facetsJsonResponse.pagination.total }, thisB.mutationResultsTab.containerNode);

                                var addMutationsButton = new Button({
                                    label: "Add SSMs",
                                    iconClass: "dijitIconSave",
                                    onClick: function() {
                                        thisB.addSSMTrack()
                                    }
                                }, "addMutations").placeAt(thisB.mutationResultsTab.containerNode);
                            }
                        }, function (res3) {
                            console.error('error', res3);
                        });
                    }, function (err) {
                        console.error('error', err);
                    });
            } else if (type === 'gene') {
                dom.empty(thisB.geneResultsTab.containerNode);
                thisB.prettyPrintFilters(thisB.geneResultsTab.containerNode, thisB.geneFilters);

                var geneUrl = thisB.createGeneUrl(combinedFacetObject);
                fetch(geneUrl).then(function (facetsResponse) {
                    facetsResponse.json().then(function (facetsJsonResponse) {
                            if (!facetsJsonResponse.code) {
                                dom.create('div', { innerHTML: 'Genes found: ' + facetsJsonResponse.pagination.total }, thisB.geneResultsTab.containerNode);

                                var addGenesButton = new Button({
                                    label: "Add Genes",
                                    iconClass: "dijitIconSave",
                                    onClick: function() {
                                        thisB.addGeneTrack(combinedFacetObject)
                                    }
                                }, "addGenes").placeAt(thisB.geneResultsTab.containerNode);
                            }
                        }, function (res3) {
                            console.error('error', res3);
                        });
                    }, function (err) {
                        console.error('error', err);
                    });
            }
        },

        createDonorUrl: function(combinedFacetObject) {
            var thisB = this;
            return encodeURI('https://dcc.icgc.org/api/v1/donors?include=facets&from=' + thisB.getDonorStartIndex()  + '&size=' + thisB.pageSize + '&sort=ssmAffectedGenes&filters=' + combinedFacetObject);
        },

        createGeneUrl: function(combinedFacetObject) {
            var thisB = this;
            return encodeURI('https://dcc.icgc.org/api/v1/genes?filters=' + combinedFacetObject);
        },

        createMutationUrl: function(combinedFacetObject) {
            var thisB = this;
            return encodeURI('https://dcc.icgc.org/api/v1/mutations?filters=' + combinedFacetObject);
        },

        getDonorStartIndex: function() {
            var thisB = this;
            return thisB.pageSize * (thisB.page - 1) + 1;
        },

        createCombinedFacets: function() {
            var thisB = this;
            var donorFilter = JSON.parse(thisB.convertFiltersObjectToString('donor', thisB.donorFilters));
            var mutationFilter = JSON.parse(thisB.convertFiltersObjectToString('mutation', thisB.mutationFilters));
            var geneFilter = JSON.parse(thisB.convertFiltersObjectToString('gene', thisB.geneFilters));

            var combinedFilters = Object.assign({}, donorFilter, mutationFilter, geneFilter);
            return JSON.stringify(combinedFilters);
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

        previousPage: function() {
            var thisB = this;
            thisB.page = thisB.page - 1;
            thisB.updateAccordion('donor');
            thisB.updateSearchResults('donor');
        },

        nextPage: function() {
            var thisB = this;
            thisB.page = thisB.page + 1;
            thisB.updateAccordion('donor');
            thisB.updateSearchResults('donor');
        },

        createDonorButtons: function(donorId, availableDataTypes, holder) {
            var thisB = this;
            if (availableDataTypes.includes("ssm")) {
                var ssmButton = new Button({
                    iconClass: "dijitIconSave",
                    onClick: function() {
                        thisB.addDonorSSMTrack(donorId);
                    }
                }, "ssmButton").placeAt(holder);
            }
        },

        addDonorSSMTrack: function(donorId) {
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

        addGeneTrack: function (combinedFacetObject) {
            var thisB = this;
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'icgc-viewer/Store/SeqFeature/icgcGenes',
                filters: JSON.parse(combinedFacetObject)
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

        addSSMTrack: function (combinedFacetObject) {
            var thisB = this;
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'icgc-viewer/Store/SeqFeature/icgcSimpleSomaticMutations',
                filters: JSON.parse(combinedFacetObject)
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

        prettyString: function(value) {
            return value ? value : "N/A";
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

        updateAccordion: function(type) {
            var thisB = this;
            thisB.destroyAccordions(type);
            thisB.accordionCount = thisB.accordionCount + 1;
            thisB.createAccordions(type);
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