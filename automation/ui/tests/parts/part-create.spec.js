import { test } from '@playwright/test';
import { assertCredentialsAvailable, environment } from '../../config/environment.js';
import { createUniquePartData } from '../../data/parts.js';
import { DashboardPage } from '../../pages/DashboardPage.js';
import { LoginPage } from '../../pages/LoginPage.js';
import { PartsPage } from '../../pages/PartsPage.js';

test.describe('InvenTree - Part creation', () => {
  test('a logged-in user can create a new part', async ({ page }) => {
    // Fail fast with a clear message if credentials were not configured,
    // rather than letting the login step fail ambiguously.
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
  });
});
