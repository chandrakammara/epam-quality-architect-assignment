import { test } from '@playwright/test';
import { assertCredentialsAvailable, environment } from '../../config/environment.js';
import { createUniqueParameterData } from '../../data/parameters.js';
import { createUniquePartData } from '../../data/parts.js';
import { DashboardPage } from '../../pages/DashboardPage.js';
import { LoginPage } from '../../pages/LoginPage.js';
import { PartParametersPage } from '../../pages/PartParametersPage.js';
import { PartsPage } from '../../pages/PartsPage.js';

test.describe('InvenTree - Part Parameter creation', () => {
  test('a logged-in user can add a parameter to a newly created part', async ({
    page
  }) => {
    // This flow chains a part creation with its own follow-up parameter
    // template creation, parameter creation, and table verification - all
    // driven by auto-retrying assertions/locators (no fixed waits), but
    // their combined total can exceed Playwright's default 30s per-test
    // budget on this resource-constrained environment (consistent with the
    // other multi-step specs in this suite).
    test.setTimeout(60000);

    // Fail fast with a clear message if credentials were not configured,
    // rather than letting the login step fail ambiguously.
    assertCredentialsAvailable();

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const partsPage = new PartsPage(page);
    const partParametersPage = new PartParametersPage(page);

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

    const parameterData = createUniqueParameterData();

    await partParametersPage.openParametersTab();
    await partParametersPage.openAddParameterForm();
    await partParametersPage.addParameter(parameterData);
    await partParametersPage.verifyParameterAdded(parameterData);
  });
});
