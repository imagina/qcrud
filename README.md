## QCRUD  | 2.0.4

This package has a components to make a CRUD in the best and fast way

## Installation

`` npm i @imagina/qcrud@2.0.4 ``

## Usage

You must create a file `.vue` with a `computed` method, than will content all params 
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
            create: {
              icon : 'icon-name',
              title: 'title',
              to : '<route-name>' // optional, if you wan create custom form in other page
            },
            read: {
              search : Boolean, // Define if activate search field. Default it's true
              columns: ['array of object with columns to component qtable'],
              requestParams : {'standard-params-to-request'},
              actions : [//Add action buttons by record
                {
                  icon : '',
                  color : '',
                  route : 'name.route', //redirect to route, and set all data row as route params
                  action : (rowData) => {} //Get row data as param
                }
              ],
              filters : {'... Object with format fields'}, //Field to filter data
            },
            update: {
              title: 'title'
              requestParams : {'standard-params-to-request'},
              to : '<route-name>' // optional, if you wan create custom form in other page
            },
            delete: Boolean, //Permit delete record, if it's true same validate permission to delete
            formLeft: {{},{},'... Object with format fields'}, //If just set form left. field has 100% width
            formRight: {{},{},'... Object with format fields'}, //Optional. create form with secodn columnd right
          }
        }
      },
    }
  </script>
  ```
    
- #### Format fields
  With this format can create fields to use in `filters`, `fomrLeft` and `formRight`
    
    ```
      {
        label: `${this.$tr('ui.label.role')}:`,
        value: 'value',
        type: [text,number,phone,password,checkPassword,textarea,chips,select,date,html,multiSelect,checkbox,media],
        rules : [], //rules to validate field
        isTranslatable : Booblean, //Set field as translatable
        options: [ //Options to load only in type [select, multiSelect]
          {label: this.$tr('ui.label.all'), id: '0'}
        ],
        loadOptions: { //Async load options form request, only in types [select, multiSelect]
          apiRoute: 'apiRoutes.quser.roles', //apiRoute to request
          select: {label: 'name', id: 'id'}, //Define fields to config select
          delayed : () => {} //Load async options
        },
        create : { //Set crud coponent to create other entity
          title : 'title'
          component : import('path-crud')
        },
        zone : 'name', //Filed only to use with type [media]
        entity : 'name', //Filed only to use with type [media]
        entityId : 'name', //Filed only to use with type [media]
      }
    ```      
    
  When the `cud.vue` file has been created, you just use the `<crud>` component (this component is registered globally 
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
    
## Services    

  Using `$crud` can access to this predefined services to call data with standard.
  
  | Service | Sintax | Description |
  | --------- | ---------- | -------- |
  | create | `$crud.create(<apiRoute>, data)` | Create new record |
  | index | `$crud.index(<apiRoute>, params : {refresh, remember , params})` | Request data |
  | show | `$crud.show(<apiRoute>, criteria, params : {refresh, remember , params})` | Request single record |
  | update | `$crud.update(<apiRoute>, criteria, data, params : {params})` | Update record |
  | delete | `$crud.delete(<apiRoute>, criteria, params : {params})` | Delete Record |
  | post | `$crud.post(<apiRoute>, params : {data, requestParams}})` | Method post |
  | get | `$crud.get(<apiRoute>, params})` | Method get | 
  | put | `$crud.put(<apiRoute>, data})` | Method put | 
  
## Store    

  To use `SSR` it's necessary save data in `store`. This actions make request with same way of `services` and save
  response in states.
  
  | Action | Sintax | Description |
  | --------- | ---------- | -------- |
  | index | `$store.dispatch('qcrudMaster/INDEX', indexName, apiRoute, requestParams : {})` | Request data and save in `$store.state.qcrudMaster.index[indexName]` |
  | show | `$store.dispatch('qcrudMaster/SHOW', indexName, criteria, apiRoute, requestParams : {})` | Request single record and save in `$store.state.qcrudMaster.show[indexName]` |
