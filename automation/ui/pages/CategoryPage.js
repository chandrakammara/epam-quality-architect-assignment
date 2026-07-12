import { expect } from '@playwright/test';

/**
 * Page Object for the InvenTree "Part Categories" section and the
 * "New Part Category" create form.
 *
 * Categories live on the same `/web/part/category/index/` screen as
 * `PartsPage` (see pages/part/CategoryDetail.tsx), inside the shared
 * `partcategory` side-panel tab group. The panel named `subcategories`
 * (tables/part/PartCategoryTable.tsx) is what actually lists categories:
 *  - at the top level (no category selected) its tab label is
 *    "Part Categories", and it lists root categories.
 *  - inside a specific category's detail page its tab label becomes
 *    "Subcategories", and it lists that category's own children
 *    (`PartCategoryTable` is passed `parentId` from the route, and the
 *    "New Part Category" form's `parent` field is pre-filled from it -
 *    see tables/part/PartCategoryTable.tsx).
 *
 * Both contexts render the exact same "Add Part Category" action and
 * create-form fields, which is why most locators below are shared.
 */
export class CategoryPage {
  constructor(page) {
    this.page = page;

    // Shared tab strip for the `partcategory` pageKey (see
    // components/panels/PanelGroup.tsx). Only one of the two category-list
    // tabs is ever rendered on a given page - the top-level "Part
    // Categories" tab, or a specific category's "Subcategories" tab -
    // since PanelGroup never renders a `hidden` panel's tab at all.
    this.panelTabs = page.getByLabel('panel-tabs-partcategory');
    this.topLevelCategoriesTab = this.panelTabs.getByRole('tab', {
      name: 'Part Categories'
    });
    this.subcategoriesTab = this.panelTabs.getByRole('tab', {
      name: 'Subcategories'
    });
    // Combined locator: whichever of the two category-list tabs is
    // present on the current page (see openCreateCategoryForm()).
    this.categoriesTab = this.topLevelCategoriesTab.or(this.subcategoriesTab);

    // The table toolbar's search input (aria-label set in
    // components/SearchInput.tsx) is generic across every InvenTree data
    // table, including both the root and per-category category tables.
    this.tableSearchInput = page.getByLabel('table-search-input');

    // "Add Part Category" is a standalone icon action (`AddItemButton` /
    // `ActionButton`, not a dropdown menu like "Add Parts"). Its
    // aria-label is generated from its tooltip text as
    // `action-button-${identifierString(tooltip)}`
    // (see lib/components/ActionButton.tsx), which keeps it stable
    // regardless of the visible icon or layout.
    this.addCategoryButton = page.getByRole('button', {
      name: 'action-button-add-part-category'
    });

    // Create/Edit "Part Category" form fields, following the same
    // `text-field-<fieldName>` aria-label convention as the Part form
    // (see components/forms/fields/TextField.tsx) - this is generated
    // from the field's own name, not the model, so it applies here too.
    this.nameInput = page.getByLabel('text-field-name', { exact: true });
    this.descriptionInput = page.getByLabel('text-field-description', {
      exact: true
    });
    this.submitButton = page.getByRole('button', { name: 'Submit' });

    // A specific category's detail page shows a full-page loading
    // overlay while its instance data is being (re)fetched
    // (`<LoadingOverlay visible={instanceQuery.isFetching} />` in
    // pages/part/CategoryDetail.tsx). It can still be intercepting
    // pointer events for a moment right after navigating in, so
    // `openCategory()`/`openChildCategory()` explicitly wait for it to
    // clear before handing back control - otherwise an immediate
    // follow-up click (e.g. on a panel tab) can flake. Mantine assigns
    // this stable, documented class name for styling hooks, so it's
    // used here purely as a "is the page still loading" signal, not as
    // a stand-in for a real accessible locator.
    this.loadingOverlay = page.locator('.mantine-LoadingOverlay-root');
  }

  /**
   * Waits for a category detail page's own loading overlay to clear,
   * so it's safe to interact with the page underneath it.
   */
  async waitForCategoryLoaded() {
    await expect(this.loadingOverlay).toBeHidden({ timeout: 20000 });
  }

  /**
   * Confirms the Part Categories section has loaded at the top level:
   * we're on the parts URL and the "Part Categories" panel tab (listing
   * root categories) is available.
   */
  async verifyCategoriesPageLoaded() {
    await expect(this.page).toHaveURL(/\/web\/part\//);
    await expect(this.topLevelCategoriesTab).toBeVisible();
  }

  /**
   * Switches to whichever category-list panel tab is present (top-level
   * "Part Categories" or the current category's "Subcategories") and
   * opens the "New Part Category" form via the shared "Add Part
   * Category" action.
   */
  async openCreateCategoryForm() {
    await this.categoriesTab.click();
    await expect(this.tableSearchInput).toBeVisible();

    await this.addCategoryButton.click();

    // Confirms the "New Part Category" form has actually rendered
    // before any field is filled in.
    await expect(this.nameInput).toBeVisible();
  }

  /**
   * Confirms a category was created successfully.
   *
   * On success, the create-category modal navigates to the newly
   * created category's own detail page (`useCreateApiFormModal`'s
   * `follow: true` option, set in tables/part/PartCategoryTable.tsx) -
   * mirroring how part creation behaves. The URL check is given a
   * longer polling window than the default, since the modal only
   * navigates away once the create request round-trips to the API.
   * @param {string} categoryName
   */
  async verifyCategoryCreated(categoryName) {
    await expect(this.page).toHaveURL(/\/web\/part\/category\/\d+/, {
      timeout: 15000
    });
    await expect(
      this.page.getByText(categoryName, { exact: true })
    ).toBeVisible();
  }

  /**
   * Creates a root (top-level) part category: no parent category is
   * selected, so the form's `parent` field is left untouched/blank.
   * Assumes the top-level "Part Categories" tab is present, i.e. call
   * this right after `verifyCategoriesPageLoaded()`.
   * @param {{ name: string, description: string }} categoryData
   */
  async createRootCategory(categoryData) {
    await this.openCreateCategoryForm();
    await this.nameInput.fill(categoryData.name);
    await this.descriptionInput.fill(categoryData.description);
    await this.submitButton.click();
    await this.verifyCategoryCreated(categoryData.name);
  }

  /**
   * Navigates to a category's own detail page by name, starting from
   * the top-level category list. Used both to drill into a parent
   * category before adding a child, and to confirm a child's placement
   * under it - so it always starts from the same known location rather
   * than assuming where the current page already is.
   * @param {string} categoryName
   */
  async openCategory(categoryName) {
    await this.page.goto('/web/part/');
    await this.topLevelCategoriesTab.click();
    await expect(this.tableSearchInput).toBeVisible();

    await this.tableSearchInput.fill(categoryName);

    // `.first()`: for a root category, the row's "Path" column renders
    // the same text as its "Name" column (pathstring == name with no
    // ancestors), so both cells match by text - the "Name" column is
    // rendered first (see tableColumns in PartCategoryTable.tsx), and
    // any cell in the row navigates to the same detail page regardless
    // (InvenTreeTable's generic modelType row-click behaviour).
    await this.page
      .getByRole('cell', { name: categoryName, exact: true })
      .first()
      .click();

    await expect(this.page).toHaveURL(/\/web\/part\/category\/\d+/);
    await this.waitForCategoryLoaded();
  }

  /**
   * Creates a child category under an existing parent category, found
   * by name. Navigates into the parent's own detail page first so the
   * "New Part Category" form's `parent` field is pre-filled by
   * InvenTree itself (`initialData: { parent: parentId }` in
   * tables/part/PartCategoryTable.tsx), rather than selecting the
   * parent manually through the form's related-field picker.
   * @param {string} parentName
   * @param {{ name: string, description: string }} childData
   */
  async createChildCategory(parentName, childData) {
    await this.openCategory(parentName);
    await this.openCreateCategoryForm();
    await this.nameInput.fill(childData.name);
    await this.descriptionInput.fill(childData.description);
    await this.submitButton.click();
    await this.verifyCategoryCreated(childData.name);
  }

  /**
   * Navigates to a child category's own detail page, by drilling in
   * through its parent's "Subcategories" table.
   *
   * This is necessary because the top-level category table
   * `openCategory()` otherwise searches from is filtered to root
   * categories only (`top_level: true` in
   * tables/part/PartCategoryTable.tsx) - a child category never
   * appears there, no matter what is searched, so it can only be
   * reached via its parent.
   * @param {string} parentName
   * @param {string} childName
   */
  async openChildCategory(parentName, childName) {
    await this.openCategory(parentName);

    await this.subcategoriesTab.click();
    await expect(this.tableSearchInput).toBeVisible();

    await this.tableSearchInput.fill(childName);
    // `.first()`: see the note in `openCategory()` - matches the "Name"
    // column specifically, in case the "Path" column text overlaps.
    await this.page
      .getByRole('cell', { name: childName, exact: true })
      .first()
      .click();

    await expect(this.page).toHaveURL(/\/web\/part\/category\/\d+/);
    await this.waitForCategoryLoaded();
  }

  /**
   * Confirms a (root) category is listed in the top-level category
   * table, searched by name from a known starting point.
   * @param {string} categoryName
   */
  async verifyCategoryVisible(categoryName) {
    await this.page.goto('/web/part/');
    await this.topLevelCategoriesTab.click();
    await expect(this.tableSearchInput).toBeVisible();

    await this.tableSearchInput.fill(categoryName);
    // `.first()`: see the note in `openCategory()` - a root category's
    // "Path" column duplicates its "Name" column text.
    await expect(
      this.page.getByRole('cell', { name: categoryName, exact: true }).first()
    ).toBeVisible();
  }

  /**
   * Confirms a child category is listed under its parent's own
   * "Subcategories" table - i.e. the hierarchy relationship itself,
   * not just that the child category exists somewhere in the system.
   * @param {string} parentName
   * @param {string} childName
   */
  async verifyChildCategoryUnderParent(parentName, childName) {
    await this.openCategory(parentName);

    await this.subcategoriesTab.click();
    await expect(this.tableSearchInput).toBeVisible();

    await this.tableSearchInput.fill(childName);
    // `.first()`: kept consistent with `verifyCategoryVisible()` - the
    // child's "Path" column includes the parent's name too, so it won't
    // collide here, but matching by the "Name" column specifically keeps
    // this resilient if that ever changes.
    await expect(
      this.page.getByRole('cell', { name: childName, exact: true }).first()
    ).toBeVisible();
  }
}
