# Qcrud | Pages

## Admin

The `Admin` component is responsible for managing CRUD pages. It reads the `meta.crud` parameter from the current route and loads its configuration.

### Auto Open Edit

This component can automatically open the edit action based on the current URL's query parameters.

- **Auto Open Edit by Record ID:** If the current URL contains a query parameter `edit` with a record ID (Integer), the edit action is automatically opened. For example, `/path/url?edit={recordId}`.

### Auto Open Create

Similarly, the `Admin` component can automatically open the create action based on the current URL's query parameters.

- **Auto Open Create:** If the current URL contains a query parameter `create` with a value of `1`, the create action is automatically opened. For example, `/path/url?create=1`.
