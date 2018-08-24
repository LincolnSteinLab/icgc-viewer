define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dojo/aspect',
    'dojo/query',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/form/TextBox',
    'dijit/form/CheckBox',
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
    TextBox,
    CheckBox,
    AccordionContainer,
    ContentPane,
    on,
    ActionBarDialog
) {
    return declare(ActionBarDialog, {
        filters: {},
        constructor: function () {
            var thisB = this;
            aspect.after(this, 'hide', function () {
                focus.curNode && focus.curNode.blur();
                setTimeout(function () { thisB.destroyRecursive(); }, 500);
            });
        },

        _dialogContent: function () {
            var thisB = this;
            var container = dom.create('div', { className: 'dialog-container', style: { width: '500px' } });

            // Add the logo
            dom.create('img', {
                src: 'https://icgc.org/files/ICGC_Logo_int_small.jpg',
                width: '100'
            }, container);

            var facetUrl = 'https://dcc.icgc.org/api/v1/mutations?include=facets&facetsOnly=true&filters=' + JSON.stringify(thisB.filters);

            thisB.fetchFacets(container, facetUrl);

            thisB.resize();
            return container;
        },

        // filters={"mutation":{"clinvarClinicalSignificance":{"is":["Likely pathogenic"]},"civicEvidenceLevel":{"is":["D - Preclinical"]}}}

        fetchFacets: function(container, facetUrl) {
            var thisB = this;
            fetch(facetUrl).then(function (res) {
                    res.json().then(function (res2) {
                        if (!res2.code) {
                            console.log(res2);
                            var accordion = new AccordionContainer({ style:"height: 400px;overflow: scroll;" }, container);
                            for (var facet in res2.facets) {
                                // Create accordion pane
                                var contentPane = new ContentPane({
                                    title: facet
                                });

                                // Create an object with all facets
                                var facetHolder = dom.create('span', { style:"display: flex; flex-direction:column" });
                                res2.facets[facet].terms.forEach((term) => {
                                    var facetCheckbox = dom.create('span', { style:"display: flex; flex-direction:row" }, facetHolder)

                                    var checkBox = new CheckBox({
                                        name: facet + '-' + term.term,
                                        id: facet + '-' + term.term,
                                        value: "agreed",
                                        checked: false
                                    }, 'checkbox').placeAt(facetCheckbox);
                                    var label = dom.create("label", { "for" : facet + '-' + term.term, innerHTML: term.term + ' (' + term.count + ')' }, facetCheckbox);
                                });

                                // Place facets in accordion pane
                                dojo.place(facetHolder, contentPane.containerNode);

                                // Add accordion pane to facet
                                accordion.addChild(contentPane);
                            }

                            accordion.startup();
                        }

                        dom.create('span', { className: 'header', innerHTML: JSON.stringify(filters) }, container);

                        thisB.resize();
                    }, function (res3) {
                        console.error('error', res3);
                    });
                }, function (err) {
                    console.error('error', err);
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