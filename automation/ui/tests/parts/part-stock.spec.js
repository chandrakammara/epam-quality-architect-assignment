import { test } from '@playwright/test';
import { assertCredentialsAvailable, environment } from '../../config/environment.js';
import { createUniquePartData } from '../../data/parts.js';
import { createUniqueStockData } from '../../data/stock.js';
import { DashboardPage } from '../../pages/DashboardPage.js';
import { LoginPage } from '../../pages/LoginPage.js';
import { PartStockPage } from '../../pages/PartStockPage.js';
import { PartsPage } from '../../pages/PartsPage.js';

test.describe('InvenTree - Part Stock creation', () => {
  test('a logged-in user can add stock to a newly created part and see the total update', async ({
    page
  }) => {
    // This flow chains a part creation with its own follow-up stock item
    // creation and two separate verifications (the stock item's own page,
    // then the part's own updated total) - all driven by auto-retrying
    // assertions/locators (no fixed waits), but their combined total can
    // exceed Playwright's default 30s per-test budget on this
    // resource-constrained environment (consistent with the other
    // multi-step specs in this suite).
    test.setTimeout(60000);

    // Fail fast with a clear message if credentials were not configured,
    // rather than letting the login step fail ambiguously.
    assertCredentialsAvailable();

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const partsPage = new PartsPage(page);
    const partStockPage = new PartStockPage(page);

    await loginPage.goto();
    await loginPage.login(environment.username, environment.password);
    await loginPage.verifyLoginSucceeded();

    await dashboardPage.verifyDashboardLoaded();
    await dashboardPage.goToParts();
    await partsPage.verifyPartsPageLoaded();

    // `createUniquePartData()` never enables `virtual`/`trackable` - both
    // checkboxes default to unchecked on the live "Add Part" form used
    // here, confirmed by inspecting the rendered form directly - so this
    // is already a non-virtual, non-trackable part without needing any
    // extra fields filled in. That matters for stock: a virtual part
    // hides the "Stock" tab entirely, and a trackable part would require
    // serial numbers matching its quantity.
    const partData = createUniquePartData();

    await partsPage.openCreatePartForm();
    await partsPage.createPart(partData);
    await partsPage.verifyPartCreated(partData.name);

    // Captured before any tab navigation, so the final total check can
    // return to this exact canonical URL rather than relying on browser
    // history (see PartStockPage.verifyPartStockTotal's source note).
    const partUrl = page.url();

    // A freshly created part always starts with zero stock, so the
    // quantity created below becomes the part's exact new total.
    const stockData = createUniqueStockData();

    await partStockPage.openStockTab();
    await partStockPage.openCreateStockForm();
    await partStockPage.createStock(stockData);
    await partStockPage.verifyStockCreated(stockData);
    await partStockPage.verifyPartStockTotal(stockData.quantity, partUrl);
  });
});
