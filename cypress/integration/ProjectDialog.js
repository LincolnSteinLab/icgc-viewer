/**
 * Tests the project dialog
 */
describe('Project dialog', function() {
    before(function() {
        cy.visit('http://localhost:3000/?loc=1%3A1..248956422')
        cy
            .server()

        cy
            .route({
                method: 'GET',
                url: 'api/v1/mutations?filters=*',
                response: 'fixture:project/mutations.json'
              }).as('getMutations')

        cy
            .route({
                method: 'GET',
                url: 'api/v1/genes?filters=*',
                response: 'fixture:project/genes.json'
            }).as('getGenes')

        cy
            .route({
                method: 'GET',
                url: 'api/v1/mutations/MU4781079?field=occurences&from=1&size=0',
                response: 'fixture:project/mutation.json'
            }).as('getMutation')

        cy
            .route({
                method: 'GET',
                url: 'api/v1/genes/ENSG00000075151',
                response: 'fixture:project/gene.json'
            }).as('getGene')

        cy.wait(1000) // Wait for load
    })

    it('Should be able to view projects', function() {
        // Open track menu
        cy.get('#dropdownbutton_icgc').type('{enter}')
        cy.contains('Exploration').click()
        cy.contains('Explore projects').click()

        // Check that projects viewer is opened and has expected content
        cy.contains('View projects available on the ICGC Data Portal')
        cy.contains('BRCA-US')
        cy.get('.results-table').should('be.visible')

        // Add SSM and Gene track for project BRCA-US (assume first in list)
        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('All Mutations').click()

        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('All Genes').click()

        // Go to next page and ensure pagination works (assume PRAD-CA on second page)
        cy.contains('Next').click()
        cy.contains('PRAD-CA')

        cy.contains('ICGC Project Browser').parent().within(() => {
            cy.get('.dijitDialogCloseIcon').click()
        })

        // Tracks should be added for project BRCA-US
        cy.wait(['@getMutations.all', '@getGenes.all'])
        cy.contains('ICGC_SimpleSomaticMutations_BRCA-US')
        cy.contains('ICGC_Genes_BRCA-US')

        cy.get('.track_icgc_viewer_view_track_ssmtrack').within(() => {
            cy.get('.feature').eq(30).click()
        })

        cy.get('.popup-dialog').within(() => {
            cy.wait('@getMutation')
            cy.contains('MU4781079')
            cy.contains('C>G')
            cy.contains('single base substitution')
            cy.contains('DDI2')
            cy.contains('L138V')
            cy.contains('missense variant')
            cy.contains('412C>G')

            cy.contains('BRCA-US')
            cy.contains('Breast')
            cy.contains('1 / 1020 (0.10%)')

            cy.get('.dijitDialogCloseIcon').click()
        })

        cy.get('.track_icgc_viewer_view_track_genetrack').within(() => {
            cy.get('.feature').eq(30).click()
        })

        cy.get('.popup-dialog').within(() => {
            cy.wait('@getGene')
            cy.contains('eukaryotic translation initiation factor 4 gamma, 3')
            cy.contains('ENSG00000075151')
            cy.contains('EIF4G3')
            cy.contains('protein_coding')
            cy.contains('8672')
            cy.contains('3298')
            cy.contains('603929')
            cy.contains('O43432')
            cy.contains('The protein encoded by this gene is thought to be part of the eIF4F protein complex')

            cy.contains('Immune System')
            cy.contains('ISG15 antiviral mechanism')
            cy.contains('translation factor activity, RNA binding')

            cy.get('.dijitDialogCloseIcon').click()
        })
    })
})
