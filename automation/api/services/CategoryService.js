import { BaseApiService } from './BaseApiService.js';

// API service class for InvenTree's Part Category endpoints
// (source-specifications/inventree-openapi.yaml.yaml, `/api/part/category/` paths).
export class CategoryService extends BaseApiService {
  static BASE_PATH = '/api/part/category/';

  /** GET /api/part/category/ - paginated, filterable/searchable Category list. */
  list(params = {}) {
    return this.get(CategoryService.BASE_PATH, { limit: 25, ...params });
  }

  /** POST /api/part/category/ - create a Category. Only `name` is schema-required. */
  create(payload) {
    return this.post(CategoryService.BASE_PATH, payload);
  }

  /** GET /api/part/category/{id}/ - retrieve a single Category. */
  getById(id, params) {
    return this.get(`${CategoryService.BASE_PATH}${id}/`, params);
  }

  /** DELETE /api/part/category/{id}/ - remove a Category. */
  remove(id) {
    return this.delete(`${CategoryService.BASE_PATH}${id}/`);
  }
}
