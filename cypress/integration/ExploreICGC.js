/**
 * Tests the explore dialog
 */
describe('Select tracks from explore', function() {
    before(function() {
        cy.viewport('macbook-13')
        cy.visit('http://localhost:3000/?loc=1%3A1..248956422')

        cy
            .server()

        cy
            .route({
                method: 'GET',
                url: 'api/v1/donors/DO232761/genes?filters=*',
                response: 'fixture:explore/genes.json'
              }).as('getGenes')

        cy
            .route({
                method: 'GET',
                url: 'api/v1/donors/DO232761/mutations?filters=*',
                response: 'fixture:explore/mutations.json'
            }).as('getMutations')

        cy.wait(1000) // Wait for load
        openExploreDialog()
    })

    /**
     * Opens the explore dialog
     */
    var openExploreDialog = function () {
        cy.get('#dropdownbutton_icgc').type('{enter}')
        cy.contains('Explore donors, genes and mutations').click()
    }

    /**
     * Selects a facet tab, an accordion in that tab, and an option in that accordion
     * @param {number} tabIndex tab index (0-2)
     * @param {number} accordionIndex accordionIndex(0-n)
     * @param {number} optionIndex optionIndex (0-m)
     */
    var selectFacetTab = function (tabIndex, accordionIndex, optionIndex) {
        cy.get('.dijitTabListWrapper').eq(0).within(() => {
            cy.get('.dijitTab').eq(tabIndex).click()
        })

        cy.get('.dijitTabContainerTopChildWrapper.dijitVisible').eq(0).within(() => {
            cy.get('.dijitAccordionTitle').eq(accordionIndex).click()
            cy.get('.dijitAccordionChildWrapper').eq(accordionIndex).within(() => {
                cy.get('.dijitCheckBox').eq(optionIndex).click()
            })
        })
    }

    /**
     * Close the popup window
     */
    var closePopup = function() {
        cy.contains('ICGC Browser').parent().within(() => {
            cy.get('.dijitDialogCloseIcon').click()
        })
    }

    /**
     * Select a results tab
     * @param {number} tabIndex index of tab (0-2)
     */
    var selectResultsTab = function (tabIndex) {
        cy.get('.dijitTabListWrapper').eq(1).within(() => {
            cy.get('.dijitTab').eq(tabIndex).click()
        })
    }

    /**
     * Checks the tab container for the existance of the given text
     * @param {Array<String>} textValues array of text
     */
    var checkResultsTab = function (textValues) {
        cy.get('.dijitTabContainer').eq(1).within(() => {
            for (var text of textValues) {
                cy.contains(text)
            }
        })
    }

    /**
     * Checks that each results tab has the expected information
     * Assumes donor tab is already selected
     * @param {*} donorArray array of strings to check for on donor tab
     * @param {*} geneArray array of strings to check for on gene tab
     * @param {*} mutationArray array of strings to check for on mutation tab
     */
    var checkAllResultsTab = function(donorArray, geneArray, mutationArray) {
        // Validate donor results
        checkResultsTab(donorArray)

        // Validate gene results
        selectResultsTab(1)
        checkResultsTab(geneArray)

        // Validate mutation results
        selectResultsTab(2)
        checkResultsTab(mutationArray)
    }

    /**
     * Clears all applied filters
     */
    var clearFilters = function() {
        // Remove filters
        cy.get('.dijitIconDelete').click()

        // Check that filters are clear
        selectResultsTab(0)
        checkResultsTab(['Showing 1 to 20 of 24,289'])
    }

    it('Should be able to explore and apply facets', function() {
        // Select relapse type -> distant recurrence/metastasis
        cy.get('.dijitDialog').within(() => {
            cy.contains('Explore data available on the ICGC Data Portal')
            selectFacetTab(0, 0, 0)
        })

        checkAllResultsTab(
            ['Showing 1 to 20 of 876', 'DO232224', 'DO229177'],
            ['Showing 1 to 20 of 57,412', 'CSMD1', 'PCDH15'],
            ['Showing 1 to 20 of 11,115,580', 'MU37643', 'MU12519']
        )

        // Select study - PCAWG
        cy.get('.dijitDialog').within(() => {
            selectFacetTab(0, 4, 0)
        })

        checkAllResultsTab(
            ['Showing 1 to 20 of 153', 'DO51962', 'DO51493'],
            ['Showing 1 to 20 of 55,957', 'RBFOX1', 'PCDH15'],
            ['Showing 1 to 20 of 1,609,595', 'MU37643', 'MU11602977']
        )

        // Clear filters
        clearFilters()

        // Add tracks and check that they were added
        cy.get('.dijitTabContainer').eq(1).within(() => {
            cy.contains('All Genes for Donor').eq(0).click()
            cy.contains('All SSMs for Donor').eq(0).click()
        })

        closePopup()

        cy.wait(['@getMutations', '@getGenes'])

        // Check that tracks are added
        cy.contains('ICGC_Genes_DO232761')
        cy.contains('ICGC_SimpleSomaticMutations_DO232761')
    })

    it('Should be able to apply filters across data types', function() {
        openExploreDialog()

        // Clear filters
        clearFilters()

        // Select study - PCAWG
        cy.get('.dijitDialog').within(() => {
            selectFacetTab(0, 4, 0)
        })

        checkAllResultsTab(
            ['Showing 1 to 20 of 2,809', 'DO220886', 'DO220877'],
            ['Showing 1 to 20 of 57,402', 'CSMD1', 'LRP1B'],
            ['Showing 1 to 20 of 25,129,453', 'MU37643', 'MU12519']
        )

        // Apply gene filter - type rRNA
        selectResultsTab(0)
        cy.get('.dijitDialog').within(() => {
            selectFacetTab(1, 1, 24)
        })

        checkAllResultsTab(
            ['Showing 1 to 20 of 1,974', 'DO220877', 'DO220906'],
            ['Showing 1 to 20 of 517', 'RNA5-8SP2', 'RNA5SP272'],
            ['Showing 1 to 20 of 39,868', 'MU9416907', 'MU51522486']
        )

        // Apply mutation filter - consequence type exon variant
        selectResultsTab(0)
        cy.get('.dijitDialog').within(() => {
            selectFacetTab(2, 5, 1)
        })

        checkAllResultsTab(
            ['Showing 1 to 20 of 312', 'DO220903', 'DO220913'],
            ['Showing 1 to 20 of 260', 'RNA5SP406', 'RNA5SP26'],
            ['Showing 1 to 20 of 445', 'MU3457350', 'MU33141830']
        )

        // Clear filters
        clearFilters()
    })
})