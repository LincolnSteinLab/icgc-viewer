define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'dijit/Tooltip',
    'dijit/Menu',
    'dijit/MenuItem',
    'dijit/form/ComboButton',
    'dijit/form/Button',
    'dojo/aspect',
    'JBrowse/View/Dialog/WithActionBar'
],
function (
    declare,
    dom,
    focus,
    Tooltip,
    Menu,
    MenuItem,
    ComboButton,
    Button,
    aspect,
    ActionBarDialog
) {
    return declare(ActionBarDialog, {
        // Parent DOM to hold results
        dialogContainer: undefined,
        resultsContainer: undefined,

        // Pagination variables
        page: 1,
        size: 20,
        
        /**
         * Constructor
         */
        constructor: function () {
            var thisB = this;

            aspect.after(this, 'hide', function () {
                focus.curNode && focus.curNode.blur();
                setTimeout(function () { thisB.destroyRecursive(); }, 500);
            });
        },
        
        /**
         * Create a DOM object containing GDC primary site interface
         * @return {object} DOM object
         */
        _dialogContent: function () {
            var thisB = this;
            // Container holds all results in the dialog
            thisB.dialogContainer = dom.create('div', { className: 'dialog-container', style: { width: '1200px', height: '700px' } });

            // Create header section
            thisB.createHeaderSection();

            // Update with project information
            thisB.resultsContainer = dom.create('div', { style: { width: '100%', height: '100%' } }, thisB.dialogContainer);
            thisB.getProjectInformation();

            thisB.resize();
            return thisB.dialogContainer;
        },

        /**
         * Add a header section with a logo and title
         */
        createHeaderSection: function() {
            var thisB = this;
            var headerSection = dom.create('div', { style: "display: flex; flex-direction: row; justify-content: flex-start; align-items: center;" }, thisB.dialogContainer);
            var logoSection = dom.create('div', { style: "flex-grow: 1" }, headerSection);

            dom.create('img', {
                src: 'https://icgc.org/files/ICGC_Logo_int_small.jpg',
                width: '154px',
                height: '59px'
            }, logoSection);

            var titleSection = dom.create('div', { style: "flex-grow: 12" }, headerSection);
            var aboutMessage = dom.create('h1', { innerHTML: "View projects available on the ICGC Data Portal" }, titleSection);
        },

        /**
         * Uses ICGC API to retrieve project information
         */
        getProjectInformation: function() {
            var thisB = this;

            // Clear current results
            dom.empty(thisB.resultsContainer);
            thisB.createLoadingIcon(thisB.resultsContainer);

            var url = 'https://dcc.icgc.org/api/v1/projects?from=' + (thisB.page - 1) * thisB.size + '&size=' + thisB.size;

            fetch(url).then(function(response) {
                return(response.json());
            }).then(function(response) {
                dom.empty(thisB.resultsContainer);
                // Code field only present on error
                if (!response.code) {
                    var resultsInfo = dom.create('div', { innerHTML: "Showing " + response.pagination.from + " to " + (response.pagination.from + response.pagination.count - 1) + " of " + response.pagination.total }, thisB.resultsContainer);
                    thisB.createProjectsTable(response);
                    thisB.createPaginationButtons(thisB.resultsContainer, response.pagination);
                } else {
                    var errorMessageHolder = dom.create('div', { style: 'display: flex; flex-direction: column; align-items: center;' }, thisB.resultsContainer);
                    var errorMessage = dom.create('div', { innerHTML: 'There was an error contacting ICGC.' }, errorMessageHolder);
                    var hardRefreshButton = new Button({
                        label: 'Refresh Results',
                        onClick: function() {
                            thisB.getProjectInformation();
                        }
                    }).placeAt(errorMessageHolder);
                }
            }).catch(function(err) {
                console.log(err);
            });
        },

        /**
         * Creates a table with projects
         * @param {*} response object returned by ICGC endpoint call
         */
        createProjectsTable: function(response) {
            var thisB = this;
            var table = `<table class="results-table"></table>`;
            var tableNode = dom.toDom(table);
            var rowsHolder = `
                <tr>
                    <th>Project ID</th>
                    <th>Project Name</th>
                    <th>Primary Site</th>
                    <th>Tumour Type</th>
                    <th>Cases</th>
                    <th>Actions</th>
                </tr>
            `;

            var rowsHolderNode = dom.toDom(rowsHolder);

            if (!response.code) {
                for (var hitId in response.hits) {
                    var hit = response.hits[hitId];

                    var projectRowContent = `
                            <td>${hit.id}</td>
                            <td>${hit.name}</td>
                            <td>${hit.primarySite}</td>
                            <td>${hit.tumourType} ${hit.tumourSubtype ? '/ ' + hit.tumourSubtype : '' }</td>
                            <td>${(hit.totalLiveDonorCount).toLocaleString()}</td>
                    `
                    var projectRowContentNode = dom.toDom(projectRowContent);

                    // Create element to hold buttons
                    var projectButtonNode = dom.toDom(`<td></td>`);

                    // Create dropdown button with elements
                    var geneMenu = new Menu({ style: "display: none;"});

                    var menuItemSSM = new MenuItem({
                        label: "SSMs for Project",
                        iconClass: "dijitIconNewTask",
                        onClick: (function(hit) {
                            return function() {
                                thisB.addTrack('SimpleSomaticMutations', hit.id, 'CanvasVariants');
                                alert("Adding SSM track for project " + hit.id);
                            }
                        })(hit)
                    });
                    geneMenu.addChild(menuItemSSM);

                    var menuItemGene = new MenuItem({
                        label: "Genes for Project",
                        iconClass: "dijitIconNewTask",
                        onClick: (function(hit) {
                            return function() {
                                thisB.addTrack('Genes', hit.id, 'CanvasVariants');
                                alert("Adding Gene track for project " + hit.id);
                            }
                        })(hit)
                    });
                    geneMenu.addChild(menuItemGene);
                    geneMenu.startup();

                    var buttonAllGenes = new ComboButton({
                        label: "Add Tracks",
                        iconClass: "dijitIconNewTask",
                        dropDown: geneMenu
                    });
                    buttonAllGenes.placeAt(projectButtonNode);
                    buttonAllGenes.startup();

                    // Add  tooltips
                    thisB.addTooltipToButton(menuItemGene, "Add track with all genes for the given project");
                    thisB.addTooltipToButton(menuItemSSM, "Add track with all SSMs for the given project");

                    // Place buttons in table
                    dom.place(projectButtonNode, projectRowContentNode);

                    var row = `<tr></tr>`;
                    var rowNodeHolder = dom.toDom(row);
                    dom.place(projectRowContentNode, rowNodeHolder);
                    dom.place(rowNodeHolder, rowsHolderNode);

                }
            }
            dom.place(rowsHolderNode, tableNode);
            dom.place(tableNode, thisB.resultsContainer);
        },

        /**
         * Adds a tooltip with some text to a location
         * @param {*} button Location to attach tooltip
         * @param {*} text Text to display in tooltip
         */
        addTooltipToButton: function(button, text) {
            var tooltip = new Tooltip({
                label: text
            });

            tooltip.addTarget(button);
        },

        /**
         * Generic function for adding a track of some type
         * @param {*} storeClass the JBrowse store class
         * @param {*} projectId Unique ID of the project on ICGC
         * @param {*} trackType the JBrowse track type
         */
        addTrack: function (storeClass, projectId, trackType) {
            var projectFilters = {"donor":{"projectId":{"is":[ projectId ]}}}
            
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'icgc-viewer/Store/SeqFeature/' + storeClass,
                project: projectId,
                filters: JSON.stringify(projectFilters)
            };
            var storeName = this.browser.addStoreConfig(null, storeConf);
            var randomId = Math.random().toString(36).substring(7);

            var key = 'ICGC_' + storeClass;
            var label = key + '_' + randomId;

            key += '_' + projectId
            label += '_' + projectId

            var trackConf = {
                type: 'JBrowse/View/Track/' + trackType,
                store: storeName,
                label: label,
                key: key,
                metadata: {
                    datatype: storeClass,
                    project: projectId
                }
            };

            console.log("Adding track of type " + trackType + " and store class " + storeClass + ": " + key + " (" + label + ")");

            trackConf.store = storeName;
            this.browser.publish('/jbrowse/v1/v/tracks/new', [trackConf]);
            this.browser.publish('/jbrowse/v1/v/tracks/show', [trackConf]);
        },

        /**
         * Creates a loading icon in the given location and returns
         * @param {object} location Place to put the loading icon
         * @return {object} loading icon
         */
        createLoadingIcon: function (location) {
            var loadingIcon = dom.create('div', { className: 'loading-icgc' }, location);
            var spinner = dom.create('div', {}, loadingIcon);
            return loadingIcon;
        },

        /**
         * Creates pagination buttons for search results in the given 'holder' using the 'pagination' object from the ICGC response
         * @param {object} holder
         * @param {integer} pagination
         */
        createPaginationButtons: function(holder, pagination) {
            var thisB = this;

            var paginationHolder = dom.create('div', { style:"display: flex;justify-content: center;"}, holder);
            
            if (thisB.page > 1) {
                var previousButton = new Button({
                    label: "Previous",
                    onClick: function() {
                        thisB.page -= 1;
                        thisB.getProjectInformation();
                    }
                }, "previousButton").placeAt(paginationHolder);

            }

            if (thisB.page < pagination.pages) {
                var nextButton = new Button({
                    label: "Next",
                    onClick: function() {
                        thisB.page += 1;
                        thisB.getProjectInformation();
                    }
                }, "nextButton").placeAt(paginationHolder);
            }
        },

        /**
         * Generate a GUID
         * @return {string} GUID
         */
        guid: function() {
            function s4() {
              return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },

        /**
         * Show callback for displaying dialog
         * @param {*} browser 
         * @param {*} callback 
         */
        show: function (browser, callback) {
            this.browser = browser;
            this.callback = callback || function () {};
            this.set('title', 'ICGC Project Browser');
            this.set('content', this._dialogContent());
            this.inherited(arguments);
            focus.focus(this.closeButtonNode);
        }
        
    });
});