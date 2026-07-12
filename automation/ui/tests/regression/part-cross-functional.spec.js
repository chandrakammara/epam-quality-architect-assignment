import { test } from '@playwright/test';
import { assertCredentialsAvailable, environment } from '../../config/environment.js';
import { createUniqueCategoryData } from '../../data/categories.js';
import { createUniqueParameterData } from '../../data/parameters.js';
import { createUniquePartData } from '../../data/parts.js';
import { createUniqueStockData } from '../../data/stock.js';
import { CategoryPage } from '../../pages/CategoryPage.js';
import { DashboardPage } from '../../pages/DashboardPage.js';
import { LoginPage } from '../../pages/LoginPage.js';
import { PartParametersPage } from '../../pages/PartParametersPage.js';
import { PartStockPage } from '../../pages/PartStockPage.js';
import { PartsPage } from '../../pages/PartsPage.js';

test.describe('InvenTree - Part cross-functional regression', () => {
  test('a part created under a new category ends up fully stocked, parameterised, and listed there', async ({
    page
  }) => {
    // This regression scenario chains every workflow covered by this suite's
    // other specs (category hierarchy, part creation/assignment, parameters,
    // stock) into one end-to-end business journey. Each step is still driven
    // by auto-retrying assertions/locators (no fixed waits), but their
    // combined total comfortably exceeds Playwright's default 30s per-test
    // budget on this resource-constrained environment.
    test.setTimeout(120000);

    assertCredentialsAvailable();

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const categoryPage = new CategoryPage(page);
    const partsPage = new PartsPage(page);
    const partParametersPage = new PartParametersPage(page);
    const partStockPage = new PartStockPage(page);

    await loginPage.goto();
    await loginPage.login(environment.username, environment.password);
    await loginPage.verifyLoginSucceeded();
    await dashboardPage.verifyDashboardLoaded();

    // Set up the category hierarchy a new part will be organised under.
    await dashboardPage.goToParts();
    await categoryPage.verifyCategoriesPageLoaded();

    const rootCategoryData = createUniqueCategoryData();
    const childCategoryData = createUniqueCategoryData();

    await categoryPage.createRootCategory(rootCategoryData);
    await categoryPage.createChildCategory(
      rootCategoryData.name,
      childCategoryData
    );

    // Create the part directly under that child category.
    await dashboardPage.goToParts();
    await partsPage.verifyPartsPageLoaded();

    const partData = createUniquePartData({ category: childCategoryData.name });

    await partsPage.openCreatePartForm();
    await partsPage.createPart(partData);
    await partsPage.verifyPartCreated(partData.name);

    // Captured before any tab navigation, so the stock total check below
    // can return to this exact canonical URL rather than relying on
    // browser history (see PartStockPage.verifyPartStockTotal's source
    // note on why that matters once more than one tab has been visited).
    const partUrl = page.url();

    // A part isn't fully onboarded without a descriptive parameter...
    const parameterData = createUniqueParameterData();

    await partParametersPage.openParametersTab();
    await partParametersPage.openAddParameterForm();
    await partParametersPage.addParameter(parameterData);
    await partParametersPage.verifyParameterAdded(parameterData);

    // ...and physical stock on hand.
    const stockData = createUniqueStockData();

    await partStockPage.openStockTab();
    await partStockPage.openCreateStockForm();
    await partStockPage.createStock(stockData);
    await partStockPage.verifyStockCreated(stockData);
    await partStockPage.verifyPartStockTotal(stockData.quantity, partUrl);

    // Finally, confirm the part is discoverable from where it was organised:
    // its own child category.
    await categoryPage.openChildCategory(
      rootCategoryData.name,
      childCategoryData.name
    );
    await partsPage.searchPart(partData.name);
  });
});
