import { expect } from '@playwright/test';

/**
 * Page Object for the authenticated InvenTree application shell (the
 * screen a user lands on immediately after login) and its top-level
 * navigation drawer.
 *
 * This object is only responsible for confirming the app has loaded and
 * for driving the hamburger-style navigation menu to reach other
 * sections. Section-specific behaviour (e.g. Parts) lives in its own
 * page object, so this stays small and reusable across every test that
 * starts "already logged in".
 */
export class DashboardPage {
  constructor(page) {
    this.page = page;

    // Renders only once the user is authenticated (see
    // components/nav/NavHoverMenu.tsx), and doubles as the toggle that
    // opens the navigation drawer.
    this.navigationMenuButton = page.getByRole('button', {
      name: 'navigation-menu'
    });

    // Drawer navigation items are rendered as accessible buttons whose
    // visible text is the section title (see
    // components/nav/NavigationDrawer.tsx + components/items/MenuLinks.tsx),
    // so a plain role+name locator is both stable and readable.
    this.partsNavItem = page.getByRole('button', {
      name: 'Parts',
      exact: true
    });
  }

  /**
   * Confirms the authenticated application shell has loaded, i.e. we
   * have navigated away from the login screen and the navigation entry
   * point is present.
   */
  async verifyDashboardLoaded() {
    await expect(this.page).not.toHaveURL(/\/web\/login/);
    await expect(this.navigationMenuButton).toBeVisible();
  }

  /** Opens the navigation drawer, revealing the section links. */
  async openNavigationMenu() {
    await this.navigationMenuButton.click();
    await expect(this.partsNavItem).toBeVisible();
  }

  /**
   * Opens the navigation drawer and navigates to the Parts section.
   * Waits for the URL change instead of a fixed timeout, so this is
   * safe to call immediately after login.
   */
  async goToParts() {
    await this.openNavigationMenu();
    await this.partsNavItem.click();
    await expect(this.page).toHaveURL(/\/web\/part\//);
  }
}
