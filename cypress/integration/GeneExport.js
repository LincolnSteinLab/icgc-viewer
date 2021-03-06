// Tests the exporting of gene tracks
describe('Gene track', function() {
    beforeEach(function() {
        cy.visit('http://localhost:3000/?loc=1%3A1..248956422')

        cy
            .server()
        cy
            .route({
                method: 'GET',
                url: 'api/v1/genes?filters=*',
                response: 'fixture:gene/genes.json'
              }).as('getGenes')
        cy
            .route({
                method: 'GET',
                url: 'api/v1/genes/EN*',
                response: 'fixture:gene/gene.json'
            }).as('getGene')

        // Open track menu
        cy.contains('Select').click()
        cy.wait(1000)

        // Add existing gene track (ICGC_Genes)
        cy.get('#trackSelectGrid_rowSelector_0').click()
        cy.wait('@getGenes.all')

        // Close track menu
        cy.contains('Back to browser').click()

        // Gene track should be added
        cy.contains('ICGC_Genes')
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
            cy.wait(['@getGene.all', '@getGenes']).then(() => {
                cy.wait(3000) // Give time to process results
                for (var text of textValues) {
                    cy.get('textarea').should('to.include.value', text)
                }
            })
        } else {
            cy.wait('@getGenes').then(() => {
                cy.wait(3000) // Give time to process results
                if (radioIndex === 3) {
                    cy.wait(3000) // Wait extra long for BED file
                }
                for (var text of textValues) {
                    cy.get('textarea').should('to.include.value', text)
                }
            })
        }
        cy.contains('Close').click()
    }

    // Tests the exporting feature for genes
    // Assumption: loc=1%3A1..248899548
    it('Should be able to export genes in various export formats', function() {
        testExport(2, 'GFF3', ['##gff-version 3', '##sequence-region', 'protein_coding'])
        testExport(3, 'BED', ['track name="ICGC_Genes" useScore=0', '1	237205504	237997287	ENSG00000198626		+'])
        testExport(4, 'CSV', ['id,type,chromosome,start,end,strand,gene name,symbol', 'ENSG00000198626,protein_coding,1,237205504,237997287,1,+,ryanodine receptor 2 (cardiac),RYR2'])
        testExport(5, 'Sequin Table', ['>Feature 1', '237205505	237997287	protein_coding'])
        cy.fixture('gene/track-conf-export.conf').then((json) => {
            testExport(6, 'Track Config', [json])
        })
        testExport(7, 'Track Config JSON', 
        [
`{
\t"label": "ICGC_Genes",
\t"storeClass": "icgc-viewer/Store/SeqFeature/Genes",
\t"type": "icgc-viewer/View/Track/GeneTrack",
\t"key": "ICGC_Genes",
\t"metadata": {
\t\t"datatype": "Genes"
\t},
\t"unsafePopup": true,
\t"size": 1000,
\t"filters": "{}"
}`
        ])
    })

    it('Should be able to export a URL Gene track', function() {
        cy.get('.track-menu-button').click()
        cy.contains('Share Track as URL').click()
        cy.get('textarea').should('have.value', 'http://localhost:3000/?loc=1%3A1..249012431&tracks=ICGC_Genes&highlight=&addTracks=%5B%7B%22label%22%3A%22ICGC_Genes%22%2C%22storeClass%22%3A%22icgc-viewer%2FStore%2FSeqFeature%2FGenes%22%2C%22type%22%3A%22icgc-viewer%2FView%2FTrack%2FGeneTrack%22%2C%22key%22%3A%22ICGC_Genes%22%2C%22metadata%22%3A%7B%22datatype%22%3A%22Gene%22%7D%2C%22unsafePopup%22%3Atrue%7D%5D')
    })
})