import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import {
  assertCredentialsAvailable,
  environment
} from '../../config/environment.js';

test.describe('InvenTree - Login', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('login page loads with all required fields visible', async () => {
    await loginPage.verifyLoginPageLoaded();
  });

  test('a valid user can log in and reach the authenticated app', async () => {
    // Fail fast with a clear message if credentials were not configured,
    // rather than letting the form submission fail ambiguously.
    assertCredentialsAvailable();

    await loginPage.login(environment.username, environment.password);
    await loginPage.verifyLoginSucceeded();
  });
});
