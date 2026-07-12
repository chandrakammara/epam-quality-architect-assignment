import { expect } from '@playwright/test';

/**
 * Page Object for the InvenTree "/web/login" screen.
 *
 * Encapsulates every locator and interaction needed to authenticate, so
 * test files can describe *what* they want ("log in as this user") instead
 * of *how* to click through the UI. This keeps tests short and resilient
 * to minor markup changes.
 */
export class LoginPage {
  constructor(page) {
    this.page = page;

    // InvenTree's auth form exposes stable aria-labels on its inputs
    // (see src/frontend/src/components/forms/AuthenticationForm.tsx),
    // so accessibility-based locators are both stable and readable.
    this.usernameInput = page.getByLabel('login-username');
    this.passwordInput = page.getByLabel('login-password');
    this.loginButton = page.getByRole('button', { name: 'Log In' });

    // This landmark only renders once the user is authenticated, so it
    // doubles as a reliable "login succeeded" indicator.
    this.navigationMenuButton = page.getByRole('button', {
      name: 'navigation-menu'
    });

    // InvenTree reports both client-side (e.g. a form re-validation race
    // right after submit) and server-side (e.g. wrong credentials) login
    // failures as a red Mantine notification toast (ids seen in practice:
    // "login", "auth-login-error"). Plain role="alert" is *not* specific
    // enough: InvenTree also uses it for the "Login successful" toast and
    // for unrelated persistent dashboard banners (e.g. "Superuser Mode"),
    // so this scopes to the transient notification-toast portal and its
    // error (red) colour styling, which the success toast does not have.
    // It auto-dismisses after a few seconds, so it must be polled for
    // promptly rather than waited on after a long fixed delay.
    this.loginErrorAlert = page.locator(
      '.mantine-Notifications-root .mantine-Notification-root[style*="red-filled"]'
    );

    // Remembers the last credentials passed to login(), purely so
    // verifyLoginSucceeded() can silently recover from the CSRF race
    // described on that method below by resubmitting them - callers never
    // need to pass credentials twice.
    this._lastCredentials = null;
  }

  /** Navigate directly to the login page. */
  async goto() {
    await this.page.goto('/web/login');
  }

  /**
   * Confirms the login form has rendered correctly before any interaction.
   * Useful as its own assertion, and as a safety check before login().
   */
  async verifyLoginPageLoaded() {
    await expect(this.page).toHaveURL(/\/web\/login/);
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /** Fill in credentials and submit the login form. */
  async login(username, password) {
    this._lastCredentials = { username, password };
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Confirms authentication succeeded, or fails fast with the real reason
   * when it didn't.
   *
   * Asserting only "the URL is no longer /web/login" is not reliable here:
   * this app can intermittently reject a submit - even with valid
   * credentials - due to a form validation/submit race, surfaced as a
   * dismissible "Login failed" toast, without the page ever leaving
   * /web/login. Blindly waiting for navigation in that case either times
   * out with a confusing URL-mismatch message or (if retried) hangs, since
   * there is nothing to navigate to.
   *
   * So this polls (auto-retrying; no fixed sleeps) for whichever of these
   * happens first:
   *  - the URL leaves /web/login AND the authenticated nav menu renders, or
   *  - a visible login/form/server error toast appears,
   * and turns the second case into a clear failure carrying the toast's
   * actual text, instead of a bare timeout.
   *
   * Separately, this backend has also been observed to intermittently
   * reject an otherwise-valid submit with a *server-side* CSRF error
   * ("CSRF cookie not set" / "CSRF verification failed") rather than the
   * client-side race above - e.g. when the CSRF cookie issued for the
   * login page hasn't reached the server yet on the very first submit of
   * a fresh session. That is an environmental/app timing issue, not a
   * wrong-credentials failure, and resubmitting against a freshly loaded
   * login page (which mints a new CSRF cookie) reliably recovers from it.
   * So a CSRF-flavoured error triggers exactly one such recovery attempt
   * before this method gives up; any other error (e.g. bad credentials)
   * still fails immediately with no retry.
   *
   * @param {{ timeout?: number }} [options] - Max time to wait for either
   *   outcome. Defaults to 15s: generous for this local Docker environment
   *   under load (e.g. mid-way through the longer cross-functional
   *   journey), while still failing fast on a genuine login error.
   */
  async verifyLoginSucceeded({ timeout = 15000 } = {}) {
    const { outcome, message } = await this._waitForLoginOutcome(timeout);

    if (outcome === 'success') {
      return;
    }

    if (/csrf/i.test(message) && this._lastCredentials) {
      const { username, password } = this._lastCredentials;
      await this.goto();
      await this.login(username, password);

      const retry = await this._waitForLoginOutcome(timeout);
      if (retry.outcome === 'success') {
        return;
      }
      throw new Error(`Login failed: ${retry.message}`);
    }

    throw new Error(`Login failed: ${message}`);
  }

  /**
   * Polls for the login page to resolve to either outcome described in
   * verifyLoginSucceeded's docs, and reports which one (plus the error
   * toast's text, when applicable) instead of throwing directly - this
   * lets verifyLoginSucceeded decide whether the failure is worth a CSRF
   * recovery retry before it turns things into a thrown Error.
   */
  async _waitForLoginOutcome(timeout) {
    let outcome = 'pending';

    await expect
      .poll(
        async () => {
          if (await this.loginErrorAlert.first().isVisible()) {
            outcome = 'error';
          } else if (
            !/\/web\/login/.test(this.page.url()) &&
            (await this.navigationMenuButton.isVisible())
          ) {
            outcome = 'success';
          } else {
            outcome = 'pending';
          }
          return outcome;
        },
        {
          timeout,
          message:
            'Login did not resolve: the app neither navigated away from ' +
            '/web/login with the navigation menu visible, nor showed a login error'
        }
      )
      .not.toBe('pending');

    if (outcome !== 'error') {
      return { outcome, message: null };
    }

    const messages = (await this.loginErrorAlert.allInnerTexts())
      .map((text) => text.trim())
      .filter(Boolean);
    const message =
      messages.join(' | ') || 'a login error was shown, but its text could not be read';
    return { outcome, message };
  }
}
