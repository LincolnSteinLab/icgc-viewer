define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'dojo/aspect',
    'JBrowse/View/Dialog/WithActionBar'
],
function (
    declare,
    dom,
    focus,
    aspect,
    ActionBarDialog
) {
    return declare(ActionBarDialog, {
        filters: {},
        searchByFacetContainer: undefined,

        constructor: function() {
            var thisB = this;
            thisB.filters = {};
            aspect.after(this, 'hide', function () {
                focus.curNode && focus.curNode.blur();
                setTimeout(function () { thisB.destroyRecursive(); }, 500);
            });
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
         * Pretty prints the current filters
         */
        prettyPrintFilters: function(location) {
            var thisB = this;

            var currentFilter = 0;
            var filterCount = Object.keys(thisB.filters).length;
            var prettyFacetString = "";

            for (var facet in thisB.filters) {
                if (thisB.filters[facet]) {
                    var facetString = `<span><span class="filterName">${thisB.camelCaseToTitleCase(facet)}</span>`;
                    if (thisB.filters[facet].length > 1) {
                        facetString += ` <strong>IN [ </strong>`;
                        var filterLength = thisB.filters[facet].length;
                        thisB.filters[facet].forEach(function(value, i) {
                            facetString += `<span class="filterValue">${value}</span>`;
                            if (i < filterLength - 1) {
                                facetString += ` , `
                            }
                        });
                        facetString += `<strong> ]</strong>`;
                    } else {
                        facetString += ` <strong>IS </strong><span class="filterValue">${thisB.filters[facet]}</span>`;
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
            dom.empty(thisB.searchByFacetContainer);
            thisB.accordionCount = thisB.accordionCount + 1;
            thisB.fetchFacets(thisB.createFacetUrl());
        },

        /**
         * Converts the filters object to an ICGC compatable string
         * @param {*} type Either mutation or donor
         */
        convertFiltersObjectToString: function(type) {
            var thisB = this;
            if (Object.keys(thisB.filters).length === 0) {
                return JSON.stringify(thisB.filters);
            }
            var filterObject = {};
            filterObject[type] = {};

            for (var facet in thisB.filters) {
                var facetObject = { "is": thisB.filters[facet] };
                filterObject[type][facet] = facetObject;
            }
            return JSON.stringify(filterObject);
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
                    delete thisB.filters[facet];
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