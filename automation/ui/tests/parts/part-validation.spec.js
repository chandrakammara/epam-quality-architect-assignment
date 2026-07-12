import { expect, test } from '@playwright/test';
import { assertCredentialsAvailable, environment } from '../../config/environment.js';
import { createUniquePartData } from '../../data/parts.js';
import { DashboardPage } from '../../pages/DashboardPage.js';
import { LoginPage } from '../../pages/LoginPage.js';
import { PartsPage } from '../../pages/PartsPage.js';

test.describe('InvenTree - Part validation', () => {
  test('submitting the Create Part form without a name is rejected', async ({
    page
  }) => {
    assertCredentialsAvailable();

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const partsPage = new PartsPage(page);

    await loginPage.goto();
    await loginPage.login(environment.username, environment.password);
    await loginPage.verifyLoginSucceeded();

    await dashboardPage.verifyDashboardLoaded();
    await dashboardPage.goToParts();
    await partsPage.verifyPartsPageLoaded();

    // Only IPN/description are valid here - Name is deliberately left blank.
    const partData = createUniquePartData();

    await partsPage.openCreatePartForm();
    await partsPage.submitCreatePartWithoutName(partData);
    await partsPage.verifyRequiredNameValidation();

    // Close the rejected form and confirm the table has no record for the
    // IPN that was submitted - proving the invalid submission never
    // created a part, rather than just inferring it from the form state.
    await page.getByRole('button', { name: 'Cancel' }).click();
    await partsPage.tableSearchInput.fill(partData.ipn);
    await expect(page.getByText('No records found')).toBeVisible();
  });
});
