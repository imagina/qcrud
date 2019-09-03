## QCRUD  | 1.0.3

This package has a components to make a CRUD in the best and fast way

## Installation

`` npm i @imagina/qcrud@1.0.3 ``

## Usage

- You must create a file `.vue` with a `computed` method, than will content all params 
  to config your CRUD. with next format:

    ```html
    <template></template>
    <script>
      export default {
        computed: {
          crudData() {
            return {
              apiRoute: 'api-route-name',
              permission: 'prefix-permissions (ejm: iblog.posts)',
              create: {title: 'title'},
              read: {
                columns: ['array of object with columns to component qtable'],
                requestParams : {'standard-params-to-request'},
                actions : [//Add action buttons by record
                  {
                    icon : '',
                    color : '',
                    route : 'name.route', //redirect to route, and set all data row as route params
                    action : (rowData) => {} //Get row data as param
                  }
                ]
              },
              update: {
                title: 'title'
                requestParams : {'standard-params-to-request'}
              },
              delete: 'Boolean to allow or disable method delete record',
              formLeft: {{},{},'... Object with form fields'},
              formRight: {{},{},'... Object with form fields'},
            }
          }
        },
      }
    </script>
    ```
    
- When the `cud.vue` file has been created, you just use the `<crud>` component (this component is registered globally 
  for use) and set the necesary props. with next format:

    ```html
      <!---Component CRUD-->
      <crud :crud-data="import('route-file-crud')"/>
    ```
  If you just need use function "Create" from CRUD you can use the `PROP` `just-create` and listen the event `@created`
    
    ```html
      <!---Component CRUD-->
      <crud :crud-data="import('route-file-crud')" just-create @created="your-method"/>
    ```
