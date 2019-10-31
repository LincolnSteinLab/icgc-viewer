// Tests the exporting of SSM tracks
describe('SSM track', function() {
    beforeEach(function() {
        cy.viewport('macbook-13')
        cy.visit('http://localhost:3000/?loc=1%3A1..248956422')

        cy
            .server()
        
        cy
            .route({
                method: 'GET',
                url: 'api/v1/mutations?filters=*',
                response: 'fixture:ssm/mutations.json'
              }).as('getMutations')

        cy
            .route({
                method: 'GET',
                url: 'api/v1/mutations/MU*',
                response: 'fixture:ssm/mutation.json'
            }).as('getMutation')
        
        cy
            .route({
                method: 'GET',
                url: 'api/v1/projects/LMS-FR/mutations/*/donors/counts',
                response: 'fixture:ssm/project.json'
            }).as('getProject')

        // Open track menu
        cy.contains('Select').click()
        cy.wait(1000)

        // Add existing SSM track (ICGC_Mutations)
        cy.get('#trackSelectGrid_rowSelector_1').click()
        cy.wait('@getMutations.all')

        // Close track menu
        cy.contains('Back to browser').click()

        // Gene track should be added
        cy.contains('ICGC_Mutations')
    })

    /**
     * Checks that export of a particular type works
     * @param {number} radioIndex Index of export checkbox
     * @param {string} exportType Name of export type
     * @param {Array<string>} textValues Values to check for in export
     */
    var testExport = function (radioIndex, exportType, textValues) {
        cy.get('.track-menu-button').click()
        cy.contains('Save track data').click()
        cy.contains(exportType)
        cy.get('.dijitCheckBoxInput').eq(radioIndex).click()

        cy.get('.dijitIconTask').click()
        if (radioIndex === 2) {
            cy.wait(['@getMutations', '@getMutation.all', '@getProject.all']).then(() => {
                cy.wait(3000) // Give time to process results
                for (var text of textValues) {
                    cy.get('textarea').should('to.include.value', text)
                }
            })
        } else {
            cy.wait('@getMutation').then(() => {
                cy.wait(3000) // Give time to process results
                for (var text of textValues) {
                    cy.get('textarea').should('to.include.value', text)
                }
            })
        }
        cy.contains('Close').click()
    }

    // Tests the exporting feature for ssms
    // Assumption: loc=1%3A1..248899548
    it('Should be able to export SSMs in various export formats', function() {
        testExport(2, 'GFF3', ['##gff-version 3', '##sequence-region', 'single base substitution'])
        testExport(3, 'BED', ['track name="ICGC_Mutations" useScore=0', '1	115256528	115256528	MU68272'])
        testExport(4, 'CSV', ['type,start,end,strand,id,allele in the reference assembly,mutation,reference genome assembly', 'single base substitution,115256528,115256528,,,T,T>C,GRCh37'])
        testExport(5, 'Sequin Table', ['>Feature 1', '115256529	115256528	single base substitution'])

        cy.fixture('ssm/track-conf-export.conf').then((json) => {
            testExport(6, 'Track Config', [json])
        })
        testExport(7, 'Track Config JSON', 
        [
`{
\t"label": "ICGC_Mutations",
\t"storeClass": "icgc-viewer/Store/SeqFeature/SimpleSomaticMutations",
\t"type": "icgc-viewer/View/Track/SSMTrack",
\t"key": "ICGC_Mutations",
\t"metadata": {
\t\t"datatype": "SimpleSomaticMutations"
\t},
\t"unsafePopup": true,
\t"size": 500,
\t"filters": "{\\"mutation\\":{\\"location\\":{\\"is\\":[\\"1:0-248899548\\"]}}}"
}`
        ])
    })

    it('Should be able to export an SSM track', function() {
        cy.get('.track-menu-button').click()
        cy.contains('Share Track as URL').click()
        cy.get('textarea').should('have.value', 'http://localhost:3000/?loc=1%3A1..248899548&tracks=ICGC_Mutations&highlight=&addTracks=%5B%7B%22label%22%3A%22ICGC_Mutations%22%2C%22storeClass%22%3A%22icgc-viewer%2FStore%2FSeqFeature%2FSimpleSomaticMutations%22%2C%22type%22%3A%22icgc-viewer%2FView%2FTrack%2FSSMTrack%22%2C%22key%22%3A%22ICGC_Mutations%22%2C%22metadata%22%3A%7B%22datatype%22%3A%22SSM%22%7D%2C%22unsafePopup%22%3Atrue%7D%5D')
    })
})