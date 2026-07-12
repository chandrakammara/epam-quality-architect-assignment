import { expect } from '@playwright/test';

/**
 * Page Object for the InvenTree "Parts" section
 * (`/web/part/category/index/`) and the "Add Part" create form.
 *
 * Landing on this URL shows the Part Category screen with a
 * "Part Categories" panel selected by default; the parts table itself
 * lives behind its own "Parts" tab within that page's side-panel group
 * (see pages/part/CategoryDetail.tsx + components/panels/PanelGroup.tsx).
 */
export class PartsPage {
  constructor(page) {
    this.page = page;

    // The side-panel tab strip is identified via
    // `aria-label="panel-tabs-partcategory"` (pageKey='partcategory'),
    // and the "Parts" tab within it switches to the parts data table.
    this.partsPanelTab = page
      .getByLabel('panel-tabs-partcategory')
      .getByRole('tab', { name: 'Parts' });

    // The table toolbar's search input (aria-label set in
    // components/SearchInput.tsx) is a reliable "table is ready" signal
    // for confirming the parts table has rendered.
    this.tableSearchInput = page.getByLabel('table-search-input');

    // Part creation lives behind an "Add Parts" action dropdown rather
    // than a standalone button (see tables/part/PartTable.tsx).
    // InvenTree generates the dropdown's aria-labels from its tooltip
    // ("Add Parts") and action name ("Create Part"), which is why they
    // read differently to their visible text.
    this.addPartsMenuButton = page.getByRole('button', {
      name: 'action-menu-add-parts'
    });
    this.createPartMenuItem = page.getByRole('menuitem', {
      name: 'action-menu-add-parts-create-part'
    });

    // "Add Part" form fields, identified by their aria-labels. InvenTree
    // generates these as `text-field-<fieldName>` for every text input
    // (see components/forms/fields/TextField.tsx), so they stay stable
    // even if visible labels or layout change.
    this.nameInput = page.getByLabel('text-field-name', { exact: true });
    this.ipnInput = page.getByLabel('text-field-IPN', { exact: true });
    this.descriptionInput = page.getByLabel('text-field-description', {
      exact: true
    });

    // The "Category" field is a searchable `react-select` (not a native
    // <select>), rendered by RelatedModelField.tsx for every
    // model-relation field. Its aria-label follows that component's own
    // `related-field-<fieldName>` convention, exposed to Playwright as a
    // combobox.
    this.categoryField = page.getByRole('combobox', {
      name: 'related-field-category'
    });
    this.submitButton = page.getByRole('button', { name: 'Submit' });

    // The "Part Details" tab lives in its own `panel-tabs-part` group
    // (pageKey='part' in pages/part/PartDetail.tsx) - distinct from the
    // `panel-tabs-partcategory` group used elsewhere in this class. Its
    // "Category" field is what verifyPartCategory() checks.
    this.partDetailsTab = page
      .getByLabel('panel-tabs-part')
      .getByRole('tab', { name: 'Part Details' });

    // Breadcrumb back to the parts list, shown on every part detail page
    // (see components/nav/BreadcrumbList.tsx). `exact: true` avoids
    // matching the sidebar's "Related Parts" nav item.
    this.partsBreadcrumbLink = page.getByRole('link', {
      name: 'Parts',
      exact: true
    });

    // Editing a part lives behind its own "Part Actions" dropdown on the
    // detail page (see pages/part/PartDetail.tsx), following the same
    // aria-label convention as "Add Parts".
    this.partActionsMenuButton = page.getByRole('button', {
      name: 'action-menu-part-actions'
    });
    this.editPartMenuItem = page.getByRole('menuitem', {
      name: 'action-menu-part-actions-edit'
    });

    // The edit form reuses the same fields and "Submit" button as
    // create (useEditApiFormModal, unlike bulk-edit, doesn't override
    // submitText - see hooks/UseForm.tsx), so `submitButton` is shared.
  }

  /**
   * Confirms the Parts section has loaded: we're on the parts URL and
   * the "Parts" panel tab is available to switch to.
   */
  async verifyPartsPageLoaded() {
    await expect(this.page).toHaveURL(/\/web\/part\//);
    await expect(this.partsPanelTab).toBeVisible();
  }

  /**
   * Switches to the "Parts" panel tab (bringing the parts table and its
   * "Add Parts" action on screen) and opens the "Create Part" form.
   */
  async openCreatePartForm() {
    await this.partsPanelTab.click();
    await expect(this.tableSearchInput).toBeVisible();

    await this.addPartsMenuButton.click();
    await this.createPartMenuItem.click();

    // Confirms the "Add Part" form has actually rendered before any
    // field is filled in.
    await expect(this.nameInput).toBeVisible();
  }

  /**
   * Fills in and submits the "Create Part" form. The category is
   * optional - when omitted, the form is submitted exactly as before
   * (uncategorised), preserving existing create/edit test behaviour.
   * @param {{ name: string, ipn: string, description: string, category?: string }} partData
   */
  async createPart(partData) {
    await this.nameInput.fill(partData.name);
    await this.ipnInput.fill(partData.ipn);
    await this.descriptionInput.fill(partData.description);

    if (partData.category) {
      await this.selectCategory(partData.category);
    }

    await this.submitButton.click();
  }

  /**
   * Selects a Part Category on the currently open "Add Part"/"Edit
   * Part" form, by typing its name and picking the matching option.
   *
   * The dropdown's own option text renders the category's full
   * ancestry path (`pathstring`), not just its plain name, and that
   * path is truncated to 50 characters with the *middle* elided when
   * too long (see components/render/Part.tsx's use of
   * lib/functions/String.tsx's `shortenString`) - so a deeply-nested
   * category's full name may not appear verbatim in the option text.
   * Matching against just the tail end of the category name is
   * unaffected by that truncation, since the end of the string is
   * always preserved.
   * @param {string} categoryName
   */
  async selectCategory(categoryName) {
    await this.categoryField.fill(categoryName);
    await this.page
      .getByRole('option', { name: categoryName.slice(-18) })
      .click();
  }

  /**
   * Confirms a part's detail page shows the expected category, via the
   * "Category" field on its "Part Details" panel
   * (pages/part/PartDetail.tsx). Unlike the create-form's dropdown
   * option, that field renders as a link whose text is the category's
   * plain `name` (no `model_field` override, so it falls back to
   * `data.name` - see components/details/Details.tsx's
   * `TableAnchorValue`), so it can be matched on exactly.
   * @param {string} categoryName
   */
  async verifyPartCategory(categoryName) {
    await this.partDetailsTab.click();
    await expect(
      this.page.getByRole('link', { name: categoryName, exact: true })
    ).toBeVisible();
  }

  /**
   * Submits the "Create Part" form with the Name field left empty, to
   * exercise mandatory-name validation. Other fields are populated so
   * the only invalid input is the missing name.
   * @param {{ ipn?: string, description?: string }} partData
   */
  async submitCreatePartWithoutName(partData = {}) {
    if (partData.ipn) {
      await this.ipnInput.fill(partData.ipn);
    }
    if (partData.description) {
      await this.descriptionInput.fill(partData.description);
    }
    await this.submitButton.click();
  }

  /**
   * Confirms the "Create Part" form rejected a missing Name: the form
   * stays open, and InvenTree's own validation message is shown next to
   * the field - this is the app's rendered form-state error (visible
   * behaviour), not an assumption based on the input's HTML `required`
   * attribute. The exact wording ("This field is required.") matches
   * InvenTree's own frontend test suite (tests/pui_forms.spec.ts).
   */
  async verifyRequiredNameValidation() {
    await expect(this.nameInput).toBeVisible();
    await expect(this.page.getByText('This field is required.')).toBeVisible();
  }

  /**
   * Confirms a part was created successfully.
   *
   * On success, InvenTree's create-part modal automatically navigates to
   * the newly created part's own detail page (`useCreateApiFormModal`'s
   * `follow: true` option, set in tables/part/PartTable.tsx) - it does
   * not stay on the parts list. So the most reliable signal is that
   * navigation, plus the part's name being visible on its own detail
   * page. The URL check is given a longer polling window than the
   * default, since the modal only navigates away once the create
   * request round-trips to the API; it's still an auto-retrying
   * assertion, not a fixed sleep.
   * @param {string} partName
   */
  async verifyPartCreated(partName) {
    await expect(this.page).toHaveURL(/\/web\/part\/\d+/, { timeout: 15000 });

    // `exact: true` avoids ambiguity with the page's title text, which
    // also contains the part name but truncated/prefixed
    // (e.g. "Part: AUTO-123 | <partName>"). The same generous timeout as
    // the URL check above is needed here too: the detail page can still
    // be showing its loading spinner for a moment after the URL has
    // already changed, while it resolves the part's own data (and, if
    // assigned, its category).
    await expect(this.page.getByText(partName, { exact: true })).toBeVisible({
      timeout: 15000
    });
  }

  /** From a part's detail page, returns to the parts list via the breadcrumb. */
  async navigateBackToPartsList() {
    await this.partsBreadcrumbLink.click();
    await expect(this.page).toHaveURL(/\/web\/part\//);
  }

  /**
   * Searches the parts table for a part by name. Requires the "Parts"
   * panel tab, since the parts list defaults to "Part Categories".
   *
   * The generous timeout accounts for this table's search being a live,
   * server-side filtered query (not a client-side filter) - the same
   * generic table search used everywhere in this class - which can
   * still be in flight for a moment after the search box is filled.
   * @param {string} partName
   */
  async searchPart(partName) {
    await this.partsPanelTab.click();
    await this.tableSearchInput.fill(partName);
    await expect(this.page.getByRole('cell', { name: partName })).toBeVisible({
      timeout: 15000
    });
  }

  /**
   * Opens a part from the current search results by clicking its row.
   * @param {string} partName
   */
  async openPartFromResults(partName) {
    await this.page.getByRole('cell', { name: partName }).click();
    await expect(this.page).toHaveURL(/\/web\/part\/\d+/);
  }

  /**
   * From a part's detail page, edits it via the "Part Actions" menu.
   * Only fields present on `updatedData` are changed - the IPN is never
   * touched here, so it stays as originally created.
   * @param {{ name?: string, description?: string }} updatedData
   */
  async editPart(updatedData) {
    await this.partActionsMenuButton.click();
    await this.editPartMenuItem.click();
    await expect(this.nameInput).toBeVisible();

    if (updatedData.name) {
      await this.nameInput.fill(updatedData.name);
    }
    if (updatedData.description) {
      await this.descriptionInput.fill(updatedData.description);
    }

    await this.submitButton.click();
  }

  /**
   * Confirms an edit was saved: the edit form has closed and the
   * updated values are visible on the (still current) detail page.
   * @param {{ name?: string, description?: string }} updatedData
   */
  async verifyPartUpdated(updatedData) {
    // The edit modal (unlike create) does not navigate away, so closing
    // is the only signal that the update round-tripped to the API.
    await expect(this.submitButton).not.toBeVisible({ timeout: 15000 });

    if (updatedData.name) {
      await expect(
        this.page.getByText(updatedData.name, { exact: true })
      ).toBeVisible();
    }
    if (updatedData.description) {
      // `.first()`: the description renders twice (page subtitle and
      // the "Description" detail row), so this only confirms presence.
      await expect(
        this.page.getByText(updatedData.description, { exact: true }).first()
      ).toBeVisible();
    }
  }
}
