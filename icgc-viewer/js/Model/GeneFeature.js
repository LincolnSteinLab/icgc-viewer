/**
 * Simple implementation of an Gene feature object.
 */
define([
    'JBrowse/Model/SimpleFeature',
    'dojo/_base/declare',
    'dojo/request'
   ],
   function( SimpleFeature, declare, request ) {

return declare(SimpleFeature, {

/**
 * Get a piece of data about the feature.  All features must have
 * 'start' and 'end', but everything else is optional.
 */
get: function(name) {
    var thisB = this;
    if (name == 'annotations') {
        var geneId = this.data[name.toLowerCase()];

        // Find projects related to the current mutation
        var url = encodeURI('https://dcc.icgc.org/api/v1/genes/' + geneId);
        request(url, {
            method: 'get',
            headers: { 'X-Requested-With': null },
            handleAs: 'json'
        }).then(function(gene) {
            document.getElementsByClassName('value annotations')[0].innerHTML = thisB.createProjectIncidenceTable(gene.sets);
        }).catch(function(err) {
            console.log(err)
            document.getElementsByClassName('value annotations')[0].innerHTML = 'Error creating annotations table';
        });
        return geneId;
    } else {
        return this.data[ name.toLowerCase() ];
    }
},

/**
 * Creates a table of annotations for the gene
 * @param {object} sets  
 */
createProjectIncidenceTable: function(sets) {
    var thisB = this;

    var thStyle = 'border: 1px solid #e6e6e6; padding: .2rem .2rem;';
    var setTable = '<table class="popup-table" style="border-collapse: \'collapse\'; border-spacing: 0;">';
    var goTermRow = '<tr style=\"background-color: #f2f2f2\"><td style="' + thStyle + '"><strong>GO Term</strong></td><td style="' + thStyle + '"><ul>'
    var curatedSetRow = '<tr><td style="' + thStyle + '"><strong>Curated Gene Set</strong></td><td style="' + thStyle + '"><ul>'
    var pathwayRow = '<tr style=\"background-color: #f2f2f2\"><td style="' + thStyle + '"><strong>Reactome Pathways</strong></td><td style="' + thStyle + '"><ul>'

    var hasGo = false;
    var hasSet = false;
    var hasPathway = false;

    Object.keys(sets).forEach(set => {
        var listItem = '<li>' + thisB.createLinkWithIdAndName('https://dcc.icgc.org/genesets/', sets[set].id, sets[set].name) + '</li>';
        if (sets[set].type == 'go_term' && sets[set].annotation == 'direct') {
            goTermRow += listItem;
            hasGo = true;
        } else if (sets[set].type == 'curated_set') {
            curatedSetRow += listItem;
            hasSet = true;
        } else if (sets[set].type == 'pathway') {
            pathwayRow += listItem;
            hasPathway = true;
        }
    });

    if (!hasPathway) {
        pathwayRow += 'n/a';
    }
    pathwayRow += '</ul></td></tr>'
    setTable += pathwayRow;

    if (!hasSet) {
        curatedSetRow += 'n/a';
    }
    curatedSetRow += '</ul></td></tr>'
    setTable += curatedSetRow;

    if (!hasGo) {
        goTermRow += 'n/a';
    }
    goTermRow += '</ul></td></tr>'
    setTable += goTermRow;

    setTable += '</table>';
    return setTable;
},

/**
* Creates a link to a given ID and name
* @param {string} link Base URL for link
* @param {string} id ID to apped to base URL
* @param {string} name Name to display
*/
createLinkWithIdAndName: function(link, id, name) {
   return id !== null ? "<a href='" + link + id + "' target='_blank'>" + name + "</a>" : "n/a";
}

});

});