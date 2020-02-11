/**
 * Simple implementation of an SSM feature object.
 */
define([
    'JBrowse/Model/SimpleFeature',
    'dojo/_base/declare',
    'dojo/request'
   ],
   function( SimpleFeature, declare, request ) {

return declare(SimpleFeature, {

projects: undefined,

/**
 * Get a piece of data about the feature.  All features must have
 * 'start' and 'end', but everything else is optional.
 */
get: function(name) {
    var thisB = this;
    if (name == 'projects') {
        var mutationId = this.data[name.toLowerCase()];

        // Find projects related to the current mutation
        var url = encodeURI('https://dcc.icgc.org/api/v1/mutations/' + mutationId + '?field=occurences&from=1&size=0');
        request(url, {
            method: 'get',
            headers: { 'X-Requested-With': null },
            handleAs: 'json'
        }).then(function(mutationResponse) {
            // Create an object holding all project information
            thisB.projects = {}
            for (project of mutationResponse.occurrences) {
                thisB.projects[project.projectId] = project.project;
            }

            // Find counts of affected donors for each project
            var projectArray = Object.keys(thisB.projects);
            var url = encodeURI('https://dcc.icgc.org/api/v1/projects/' + projectArray + '/mutations/' + mutationId + '/donors/counts');
            return request(url, {
                method: 'get',
                headers: { 'X-Requested-With': null },
                handleAs: 'json'
            })
        }).then(function(response) {
            document.getElementsByClassName('value projects')[0].innerHTML = thisB.createProjectIncidenceTable(thisB.projects, response, mutationId);
        }).catch(function(err) {
            console.log(err)
            document.getElementsByClassName('value projects')[0].innerHTML = 'Error creating projects table';
        });
        return mutationId;
    } else {
        return this.data[ name.toLowerCase() ];
    }
},

/**
 * Creates a table of projects and their associated tumour type and incidence rate for the given mutation
 * @param {object} projects Object of the form projectId -> projectObject
 * @param {object} projectCounts Occurrence count for each project given the mutationId
 * @param {string} mutationId ICGC ID for the mutation
 */
createProjectIncidenceTable: function(projects, projectCounts, mutationId) {
    var thStyle = 'border: 1px solid #b3b3b3; padding: .2rem .2rem;';
    var headerRow = `
        <tr style=\"background-color: #f2f2f2\">
            <th style="${thStyle}">Project</th>
            <th style="${thStyle}">Site</th>
            <th style="${thStyle}">Tumour Type</th>
            <th style="${thStyle}">Tumour Subtype</th>
            <th style="${thStyle}"># Donors Affected</th> 
        </tr>
    `;

    var projectTable = '<table class="popup-table" style="border-collapse: \'collapse\'; border-spacing: 0;">' + headerRow;

    var tdStyle = 'border: 1px solid #e6e6e6; padding: .2rem .2rem;';
    var count = 0;
    Object.keys(projects).forEach(project => {
        var trStyle = '';
        if (count % 2 != 0) {
            trStyle = 'style=\"background-color: #f2f2f2\"';
        }
        var projectRow = `<tr ${trStyle}>
            <td style="${tdStyle}">${this.createLinkWithId('https://dcc.icgc.org/projects/', project)}</td>
            <td style="${tdStyle}">${this.prettyValue(projects[project].primarySite)}</td>
            <td style="${tdStyle}">${this.prettyValue(projects[project].tumourType)}</td>
            <td style="${tdStyle}">${this.prettyValue(projects[project].tumourSubtype)}</td>
            <td style="${tdStyle}">${this.prettyValue(projectCounts[project][mutationId]) + ' / ' + projects[project].ssmTestedDonorCount} (${((projectCounts[project][mutationId] / projects[project].ssmTestedDonorCount) * 100).toFixed(2)}%)</td>
            </tr>
        `;

        projectTable += projectRow;
        count++;
    });

    projectTable += '</table>';
    return projectTable;

},

/**
 * If a value is undefined, returns n/a, else return value
 * @param {string} value Value to make pretty
 */
prettyValue: function(value) {
    return value ? value : 'n/a';
},

/**
 * Creates a link to a given ID
 * @param {string} link Base URL for link
 * @param {string} id ID to apped to base URL
 */
createLinkWithId: function(link, id) {
    return id ? "<a href='" + link + id + "' target='_blank'>" + id + "</a>" : "n/a";
},

});
});