import { BaseApiService } from './BaseApiService.js';

// API service class for InvenTree's Part endpoints
// (source-specifications/inventree-openapi.yaml.yaml, `/api/part/` paths).
// Test files call these methods instead of building requests inline, so
// endpoint paths/params live in exactly one place.
export class PartService extends BaseApiService {
  static BASE_PATH = '/api/part/';

  /**
   * GET /api/part/ - paginated, filterable/searchable Part list.
   * `limit` is documented as a required query param, so a default is
   * always applied unless the caller overrides it.
   */
  list(params = {}) {
    return this.get(PartService.BASE_PATH, { limit: 25, ...params });
  }

  /** POST /api/part/ - create a Part. Only `name` is schema-required. */
  create(payload) {
    return this.post(PartService.BASE_PATH, payload);
  }

  /** GET /api/part/{id}/ - retrieve a single Part. */
  getById(id, params) {
    return this.get(`${PartService.BASE_PATH}${id}/`, params);
  }

  /** PATCH /api/part/{id}/ - partial update of a single Part. */
  update(id, payload) {
    return this.patch(`${PartService.BASE_PATH}${id}/`, payload);
  }

  /**
   * DELETE /api/part/{id}/ - remove a Part. Blocked server-side while the
   * part is `active` or `locked` (part/models.py:581-599), so callers
   * must deactivate a part before expecting a successful delete.
   */
  remove(id) {
    return this.delete(`${PartService.BASE_PATH}${id}/`);
  }
}
