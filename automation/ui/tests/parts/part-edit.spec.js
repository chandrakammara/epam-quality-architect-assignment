import { test } from '@playwright/test';
import { assertCredentialsAvailable, environment } from '../../config/environment.js';
import { createUniquePartData } from '../../data/parts.js';
import { DashboardPage } from '../../pages/DashboardPage.js';
import { LoginPage } from '../../pages/LoginPage.js';
import { PartsPage } from '../../pages/PartsPage.js';

test.describe('InvenTree - Part editing', () => {
  test('a logged-in user can search for and edit an existing part', async ({
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

    const partData = createUniquePartData();

    await partsPage.openCreatePartForm();
    await partsPage.createPart(partData);
    await partsPage.verifyPartCreated(partData.name);

    await partsPage.navigateBackToPartsList();
    await partsPage.searchPart(partData.name);
    await partsPage.openPartFromResults(partData.name);

    // Reuse the factory for fresh, unique name/description, but pin the
    // IPN back to the original one - it must stay unchanged by this edit.
    const updatedData = createUniquePartData({ ipn: partData.ipn });

    await partsPage.editPart({
      name: updatedData.name,
      description: updatedData.description
    });
    await partsPage.verifyPartUpdated({
      name: updatedData.name,
      description: updatedData.description
    });
  });
});
