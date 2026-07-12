import { test } from '@playwright/test';
import { assertCredentialsAvailable, environment } from '../../config/environment.js';
import { createUniqueCategoryData } from '../../data/categories.js';
import { CategoryPage } from '../../pages/CategoryPage.js';
import { DashboardPage } from '../../pages/DashboardPage.js';
import { LoginPage } from '../../pages/LoginPage.js';

test.describe('InvenTree - Part Category hierarchy', () => {
  test('a logged-in user can create a root category and a child category under it', async ({
    page
  }) => {
    // This flow chains several sequential UI steps (two category
    // creations plus two follow-up verifications, each re-navigating
    // from the top-level category list) - all still driven by
    // auto-retrying assertions/locators rather than fixed waits, but
    // their combined total can exceed Playwright's default 30s per-test
    // budget on this resource-constrained environment.
    test.setTimeout(60000);

    // Fail fast with a clear message if credentials were not configured,
    // rather than letting the login step fail ambiguously.
    assertCredentialsAvailable();

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const categoryPage = new CategoryPage(page);

    await loginPage.goto();
    await loginPage.login(environment.username, environment.password);
    await loginPage.verifyLoginSucceeded();

    await dashboardPage.verifyDashboardLoaded();
    await dashboardPage.goToParts();
    await categoryPage.verifyCategoriesPageLoaded();

    // Two independent calls guarantee the root and child names never
    // collide with each other, even though they're generated moments apart.
    const rootCategoryData = createUniqueCategoryData();
    const childCategoryData = createUniqueCategoryData();

    await categoryPage.createRootCategory(rootCategoryData);
    await categoryPage.createChildCategory(
      rootCategoryData.name,
      childCategoryData
    );

    await categoryPage.verifyCategoryVisible(rootCategoryData.name);
    await categoryPage.verifyChildCategoryUnderParent(
      rootCategoryData.name,
      childCategoryData.name
    );
  });
});
