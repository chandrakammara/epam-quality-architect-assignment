import { expect } from '@playwright/test';

/**
 * Page Object for a Part's "Stock" tab (pages/part/PartDetail.tsx's
 * `stock` panel, rendered by tables/stock/StockItemTable.tsx) and the
 * "Add Stock Item" create form it opens.
 *
 * Source note (corrected via live UI): InvenTree's frontend source
 * routes the "Location" field through a `TreeField` component whose
 * aria-label follows a `tree-field-<fieldName>` convention
 * (components/forms/fields/ApiFormField.tsx /
 * components/forms/fields/TreeField.tsx). Running the actual "Add Stock
 * Item" form against a live InvenTree instance showed the deployed
 * build instead renders `location` as a plain related-model combobox
 * with aria-label `related-field-location` (no `tree-field-location`
 * element exists on the rendered form) - so this page object targets the
 * field it actually observed, not the one the checked-out source implied.
 *
 * Source note (confirmed via live UI): the "Location" field carries no
 * `required` flag in `useStockFields` (forms/StockForms.tsx), and the
 * backend (stock/api.py) auto-assigns the part's own `default_location`
 * when it is omitted entirely. Submitting the live "Add Stock Item" form
 * with only `quantity` filled in (no location selected, and no stock
 * location existing anywhere in the system) succeeded, and the part's own
 * "In Stock" total updated correctly - confirming a stock location does
 * NOT need to exist first for basic stock creation. `selectLocation()`
 * is included below purely for completeness/extensibility (e.g. suites
 * that want a location-scoped stock item, given a location that already
 * exists), and is never invoked unless a caller explicitly supplies one.
 */
export class PartStockPage {
  constructor(page) {
    this.page = page;

    // The "Stock" tab lives in the part detail page's own
    // `panel-tabs-part` group (pageKey='part' in pages/part/PartDetail.tsx),
    // alongside "Part Details"/"Parameters" (see PartsPage.partDetailsTab,
    // PartParametersPage.parametersTab). It is hidden for virtual parts,
    // so this suite only ever exercises it against a non-virtual part.
    this.stockTab = page
      .getByLabel('panel-tabs-part')
      .getByRole('tab', { name: 'Stock', exact: true });

    // The table toolbar's search input (aria-label set in
    // components/SearchInput.tsx) is a reliable "table is ready" signal,
    // consistent with every other InvenTree data table in this suite.
    this.tableSearchInput = page.getByLabel('table-search-input');

    // "Add Stock Item" is a standalone icon action (`AddItemButton`, not
    // a dropdown menu like "Add Parts"), following the same
    // `action-button-<identifierString(tooltip)>` aria-label convention
    // as CategoryPage's "Add Part Category" action (see
    // tables/stock/StockItemTable.tsx / lib/components/ActionButton.tsx).
    this.addStockItemButton = page.getByRole('button', {
      name: 'action-button-add-stock-item'
    });

    // The "Add Stock Item" modal (useCreateApiFormModal in
    // StockItemTable.tsx) is scoped by its own accessible dialog name,
    // mirroring PartParametersPage's `addParameterDialog` - this keeps
    // every field lookup unambiguous even if an aria-label happened to
    // repeat elsewhere on the page (e.g. within the stock table itself).
    this.addStockDialog = page.getByRole('dialog', { name: 'Add Stock Item' });

    // `number-field-<fieldName>`/`text-field-<fieldName>` follow the same
    // convention as every other numeric/text field in this suite (see
    // components/forms/fields/TextField.tsx). "Stock Quantity" is the
    // only field marked required (`*`) on this form besides "Part" (which
    // is pre-filled and disabled when opened from a part's own Stock tab).
    this.quantityInput = this.addStockDialog.getByLabel('number-field-quantity');

    // Related-model combobox for "Stock Location" - see the source note
    // above for why this targets `related-field-location` rather than
    // the `tree-field-location` the checked-out frontend source implies.
    this.locationField = this.addStockDialog.getByRole('combobox', {
      name: 'related-field-location'
    });

    // Optional fields, only relevant for callers that override
    // `stockData.batch`/`stockData.serial` (e.g. a trackable part).
    this.batchInput = this.addStockDialog.getByLabel('text-field-batch', {
      exact: true
    });
    this.serialNumbersInput = this.addStockDialog.getByLabel(
      'text-field-serial_numbers',
      { exact: true }
    );

    this.submitButton = this.addStockDialog.getByRole('button', {
      name: 'Submit'
    });
  }

  /**
   * Switches to the part's "Stock" tab and confirms its data table (and
   * the "Add Stock Item" action it hosts) has rendered.
   */
  async openStockTab() {
    await this.stockTab.click();
    await expect(this.tableSearchInput).toBeVisible();
    await expect(this.addStockItemButton).toBeVisible();
  }

  /**
   * Opens the "Add Stock Item" form via its standalone action button.
   * Assumes `openStockTab()` has already been called.
   */
  async openCreateStockForm() {
    await this.addStockItemButton.click();

    // Confirms the "Add Stock Item" dialog has actually rendered - and,
    // since "Part" is pre-filled/disabled here (this page is only ever
    // opened from a part's own Stock tab), that the required "Stock
    // Quantity" field is ready to be filled in.
    await expect(this.quantityInput).toBeVisible();
  }

  /**
   * Selects an existing Stock Location on the currently open "Add Stock
   * Item" form, by typing its name and picking the matching option -
   * mirroring `PartsPage.selectCategory`'s related-field pattern. Assumes
   * the named location already exists; this page object does not create
   * one on the fly (see the class-level source note on why that is not
   * required for basic stock creation).
   * @param {string} locationName
   */
  async selectLocation(locationName) {
    await this.locationField.fill(locationName);
    await this.page.getByRole('option', { name: locationName }).click();
  }

  /**
   * Fills in and submits the "Add Stock Item" form for the part whose
   * Stock tab is currently open. Only `quantity` is required; `location`,
   * `batch` and `serial` are filled in only when supplied, so existing
   * (location-less) call sites keep working unchanged.
   * @param {{
   *   quantity: number,
   *   location?: string,
   *   batch?: string,
   *   serial?: string
   * }} stockData
   */
  async createStock(stockData) {
    await this.quantityInput.fill(String(stockData.quantity));

    if (stockData.location) {
      await this.selectLocation(stockData.location);
    }
    if (stockData.batch) {
      await this.batchInput.fill(stockData.batch);
    }
    if (stockData.serial) {
      await this.serialNumbersInput.fill(stockData.serial);
    }

    await this.submitButton.click();
  }

  /**
   * Confirms a stock item was created successfully.
   *
   * On success, InvenTree's create-stock-item modal automatically
   * navigates to the newly created stock item's own detail page
   * (`useCreateApiFormModal`'s default `follow` behaviour, set in
   * tables/stock/StockItemTable.tsx) - mirroring how part/category
   * creation behaves elsewhere in this suite. The URL check is given a
   * longer polling window than the default, since the modal only
   * navigates away once the create request round-trips to the API.
   *
   * The stock item's own detail page (pages/stock/StockDetail.tsx) then
   * renders a "Quantity: <n>" badge for any non-serialised item (which
   * this suite's non-trackable part always creates) - confirming both
   * that the item exists and that it was created with the expected
   * quantity. Matched case-insensitively since the badge is rendered
   * with an all-caps text style, even though the underlying text content
   * is "Quantity", not "QUANTITY".
   * @param {{ quantity: number }} stockData
   */
  async verifyStockCreated(stockData) {
    await expect(this.page).toHaveURL(/\/web\/stock\/item\/\d+/, {
      timeout: 15000
    });

    await expect(
      this.page.getByText(
        new RegExp(`Quantity:\\s*${stockData.quantity}\\b`, 'i')
      )
    ).toBeVisible({ timeout: 15000 });
  }

  /**
   * Confirms the part's own total stock quantity reflects the stock item
   * just created, by returning to the part's detail page and checking its
   * "In Stock: <n>" header badge (pages/part/PartDetail.tsx) - the same
   * badge InvenTree shows on every tab of that page, not just "Part
   * Details".
   *
   * Source note (corrected via live UI): an earlier version of this method
   * used `page.goBack()` to return from the newly created stock item's
   * page to the part's Stock tab, which worked reliably when Stock was
   * the first part-detail tab visited in a test. In a longer regression
   * flow that had already visited another tab (e.g. "Parameters") before
   * "Stock", `goBack()` instead landed on a malformed, doubly-nested URL
   * (observed live as `/web/web/part/<id>/stock/stock`) whose header never
   * rendered the "In Stock" badge - an InvenTree tab-routing quirk, not
   * something under this suite's control. Navigating with a fresh
   * `page.goto(partUrl)` back to the part's own canonical URL avoids that
   * accumulated sub-path entirely, so callers that already have the
   * part's URL handy (captured right after `verifyPartCreated`) should
   * pass it in. `goBack()` is kept as a fallback for callers that don't.
   *
   * Only valid for a part with no prior stock (e.g. a freshly created
   * part, as this suite always uses) - `expectedTotal` is asserted as the
   * part's exact total, not merely an increase, since a fresh part starts
   * at zero.
   * @param {number} expectedTotal
   * @param {string} [partUrl] - the part's own detail page URL, captured
   *   before any tab navigation, if available.
   */
  async verifyPartStockTotal(expectedTotal, partUrl) {
    if (partUrl) {
      await this.page.goto(partUrl);
    } else {
      await this.page.goBack();
    }

    await expect(this.page).toHaveURL(/\/web\/part\/\d+/, { timeout: 15000 });
    await expect(
      this.page.getByText(new RegExp(`In Stock:\\s*${expectedTotal}\\b`, 'i'))
    ).toBeVisible({ timeout: 15000 });
  }
}
