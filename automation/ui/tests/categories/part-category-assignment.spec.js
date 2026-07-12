import { test } from '@playwright/test';
import { assertCredentialsAvailable, environment } from '../../config/environment.js';
import { createUniqueCategoryData } from '../../data/categories.js';
import { createUniquePartData } from '../../data/parts.js';
import { CategoryPage } from '../../pages/CategoryPage.js';
import { DashboardPage } from '../../pages/DashboardPage.js';
import { LoginPage } from '../../pages/LoginPage.js';
import { PartsPage } from '../../pages/PartsPage.js';

test.describe('InvenTree - Part Category assignment', () => {
  test('a newly created part can be assigned to a child category', async ({
    page
  }) => {
    // This flow chains noticeably more sequential UI steps than the
    // other specs (two category creations, a category-assigned part
    // creation, then navigating back in to verify) - each one is still
    // driven entirely by auto-retrying assertions/locators (no fixed
    // waits), but their combined total can exceed Playwright's default
    // 30s per-test budget on this resource-constrained environment.
    test.setTimeout(90000);

    // Fail fast with a clear message if credentials were not configured,
    // rather than letting the login step fail ambiguously.
    assertCredentialsAvailable();

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const categoryPage = new CategoryPage(page);
    const partsPage = new PartsPage(page);

    await loginPage.goto();
    await loginPage.login(environment.username, environment.password);
    await loginPage.verifyLoginSucceeded();

    await dashboardPage.verifyDashboardLoaded();
    await dashboardPage.goToParts();
    await categoryPage.verifyCategoriesPageLoaded();

    const rootCategoryData = createUniqueCategoryData();
    const childCategoryData = createUniqueCategoryData();

    await categoryPage.createRootCategory(rootCategoryData);
    await categoryPage.createChildCategory(
      rootCategoryData.name,
      childCategoryData
    );

    await dashboardPage.goToParts();
    await partsPage.verifyPartsPageLoaded();

    const partData = createUniquePartData({ category: childCategoryData.name });

    await partsPage.openCreatePartForm();
    await partsPage.createPart(partData);
    await partsPage.verifyPartCreated(partData.name);
    await partsPage.verifyPartCategory(childCategoryData.name);

    await categoryPage.openChildCategory(
      rootCategoryData.name,
      childCategoryData.name
    );
    await partsPage.searchPart(partData.name);
  });
});
