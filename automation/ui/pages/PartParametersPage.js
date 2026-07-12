import { expect } from '@playwright/test';

/**
 * Page Object for a Part's "Parameters" tab (pages/part/PartDetail.tsx's
 * `parameters` panel, rendered by tables/general/ParameterTable.tsx) and
 * the "Add Parameter" create form it opens.
 *
 * InvenTree parameters are always backed by a global, shared
 * `PartParameterTemplate` - the form's "Template" field is a required
 * related-model picker, not a free-text name (see
 * forms/CommonForms.tsx's `useParameterFields`). Rather than requiring that
 * template to already exist (e.g. pre-seeded via Admin Center's own
 * "Parameters" settings panel), this page object drives the same inline
 * "Create New Parameter Template" action InvenTree itself exposes on the
 * form (via the template field's own "+" button, shown because the
 * `admin` test user is staff - see RelatedModelField.tsx's
 * `addCreateFields`), so a fresh, uniquely-named template is created
 * on-the-fly as part of adding the parameter - no read/write access to the
 * InvenTree repo or a separate settings-page flow is needed.
 */
export class PartParametersPage {
  constructor(page) {
    this.page = page;

    // The "Parameters" tab lives in the part detail page's own
    // `panel-tabs-part` group (pageKey='part' in pages/part/PartDetail.tsx),
    // alongside "Part Details" etc. (see PartsPage.partDetailsTab).
    this.parametersTab = page
      .getByLabel('panel-tabs-part')
      .getByRole('tab', { name: 'Parameters' });

    // The table toolbar's search input (aria-label set in
    // components/SearchInput.tsx) is a reliable "table is ready" signal,
    // consistent with every other InvenTree data table in this suite.
    this.tableSearchInput = page.getByLabel('table-search-input');

    // "Add Parameter" lives behind an "Add Parameters" action dropdown
    // (ActionDropdown in tables/general/ParameterTable.tsx), following the
    // same aria-label convention as "Add Parts"/"Add Part Category":
    // `action-menu-<identifierString(tooltip)>` for the dropdown itself,
    // `<menu-id>-<identifierString(action name)>` for its items.
    this.addParametersMenuButton = page.getByRole('button', {
      name: 'action-menu-add-parameters'
    });
    this.createParameterMenuItem = page.getByRole('menuitem', {
      name: 'action-menu-add-parameters-create-parameter'
    });

    // The "Add Parameter" modal (useCreateApiFormModal in ParameterTable.tsx)
    // is scoped by its own accessible dialog name, so its fields can be
    // targeted unambiguously even while a second, nested dialog (the
    // inline "Create New Parameter Template" one below) is also open.
    this.addParameterDialog = page.getByRole('dialog', {
      name: 'Add Parameter'
    });
    this.templateField = this.addParameterDialog.getByRole('combobox', {
      name: 'related-field-template'
    });
    // RelatedModelField.tsx renders this "+" action whenever the field
    // definition carries `addCreateFields` (true here, since `template`
    // sets that for staff users - see forms/CommonForms.tsx). Its
    // aria-label is generated from its own tooltip ("Create New Parameter
    // Template", derived from the referenced model's label) via the same
    // `action-button-<identifierString(tooltip)>` convention as every
    // other ActionButton in this app.
    this.createTemplateButton = this.addParameterDialog.getByRole('button', {
      name: 'action-button-create-new-parameter-template'
    });
    this.dataInput = this.addParameterDialog.getByLabel('text-field-data', {
      exact: true
    });
    this.noteInput = this.addParameterDialog.getByLabel('text-field-note', {
      exact: true
    });
    this.addParameterSubmitButton = this.addParameterDialog.getByRole(
      'button',
      { name: 'Submit' }
    );

    // The inline "Create New Parameter Template" modal
    // (RelatedModelField.tsx's own `useCreateApiFormModal`), opened by
    // `createTemplateButton` above. Scoped by dialog name for the same
    // reason as `addParameterDialog`.
    this.createTemplateDialog = page.getByRole('dialog', {
      name: 'Create New Parameter Template'
    });
    this.templateNameInput = this.createTemplateDialog.getByLabel(
      'text-field-name',
      { exact: true }
    );
    this.templateDescriptionInput = this.createTemplateDialog.getByLabel(
      'text-field-description',
      { exact: true }
    );
    this.templateUnitsInput = this.createTemplateDialog.getByLabel(
      'text-field-units',
      { exact: true }
    );
    this.createTemplateSubmitButton = this.createTemplateDialog.getByRole(
      'button',
      { name: 'Submit' }
    );
  }

  /**
   * Switches to the part's "Parameters" tab and confirms its data table
   * (and the "Add Parameters" action it hosts) has rendered.
   */
  async openParametersTab() {
    await this.parametersTab.click();
    await expect(this.tableSearchInput).toBeVisible();
    await expect(this.addParametersMenuButton).toBeVisible();
  }

  /**
   * Opens the "Add Parameter" form via the "Add Parameters" dropdown.
   * Assumes `openParametersTab()` has already been called.
   */
  async openAddParameterForm() {
    await this.addParametersMenuButton.click();
    await this.createParameterMenuItem.click();

    // Confirms the "Add Parameter" dialog has actually rendered before any
    // field is filled in.
    await expect(this.templateField).toBeVisible();
  }

  /**
   * Creates the global Parameter Template that a parameter's "Template"
   * field requires, using the form's own inline "Create New Parameter
   * Template" action rather than a separate settings-page flow.
   * @param {{ name: string, templateDescription?: string, units?: string }} parameterData
   */
  async createParameterTemplate(parameterData) {
    await this.createTemplateButton.click();
    await expect(this.templateNameInput).toBeVisible();

    await this.templateNameInput.fill(parameterData.name);
    if (parameterData.templateDescription) {
      await this.templateDescriptionInput.fill(parameterData.templateDescription);
    }
    if (parameterData.units) {
      await this.templateUnitsInput.fill(parameterData.units);
    }

    await this.createTemplateSubmitButton.click();

    // The inline create-template modal resolves asynchronously (it
    // round-trips to the API) and, on success, feeds the new template's id
    // back into the "Add Parameter" form's own "Template" field
    // (RelatedModelField.tsx's `onFormSuccess: (response) => setValue(...)`).
    // That value update briefly lags behind the modal closing, so this
    // waits for the template's own name to actually render as the field's
    // selected value - an auto-retrying assertion, not a fixed sleep -
    // before returning control. Submitting the parameter immediately after
    // only the modal closes (without this wait) races that update and can
    // spuriously fail the "Add Parameter" form's own required-field
    // validation on "Template", even though the correct template *is*
    // about to be selected.
    await expect(
      this.addParameterDialog.getByText(parameterData.name, { exact: true })
    ).toBeVisible({ timeout: 15000 });
  }

  /**
   * Fills in and submits the "Add Parameter" form for the given part,
   * creating its backing Parameter Template on the fly (see
   * `createParameterTemplate`) since InvenTree has no ad-hoc,
   * template-less parameter.
   * @param {{
   *   name: string,
   *   templateDescription?: string,
   *   units?: string,
   *   value: string,
   *   note?: string
   * }} parameterData
   */
  async addParameter(parameterData) {
    await this.createParameterTemplate(parameterData);

    await this.dataInput.fill(parameterData.value);
    if (parameterData.note) {
      await this.noteInput.fill(parameterData.note);
    }

    await this.addParameterSubmitButton.click();

    // The modal does not navigate away, so - mirroring
    // `PartsPage.verifyPartUpdated` - its own closing is the clearest
    // signal that the create request round-tripped to the API.
    await expect(this.addParameterDialog).not.toBeVisible({ timeout: 15000 });
  }

  /**
   * Confirms a parameter was added to the part's "Parameters" table, and
   * that its name, value and units are all displayed correctly. Searches
   * the table by name first, since a freshly-created parameter can arrive
   * a moment after the create modal closes (the table refetches
   * server-side once the create request completes).
   * @param {{ name: string, units?: string, value: string }} parameterData
   */
  async verifyParameterAdded(parameterData) {
    await this.tableSearchInput.fill(parameterData.name);

    const row = this.page
      .getByRole('row')
      .filter({ hasText: parameterData.name });

    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.getByRole('cell', { name: parameterData.value, exact: true })).toBeVisible();

    if (parameterData.units) {
      await expect(
        row.getByRole('cell', { name: parameterData.units, exact: true })
      ).toBeVisible();
    }
  }
}
