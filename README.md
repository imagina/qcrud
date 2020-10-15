## QCRUD  | 2.1.4

This package has a components to make a CRUD in the best and fast way

## Installation

`` npm i @imagina/qcrud@2.1.4 ``

## Usage

You must create a file `.vue` with a `computed` method, than will content all params 
to config your CRUD. with next format:

  ```html
  <template></template>
  <script>
    export default {
      data (){ return {crudId : this.$uid()} },
      computed: {
        //Config To create CRUD
        crudData() {
          return {
            crudId : this.crudId,//Required
            modalId : 'modal-id',//Set custom id to crud modal 
            apiRoute: 'api-route-name',//Required
            permission: 'prefix-permissions (ejm: iblog.posts)',
            create: {
              icon : 'icon-name',
              title: 'title',
              to : {name : '<route-name>', params : {}, query : {}} // optional, if you wan create custom form in other page
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
              filterName : 'filter-name'//Load master filter from app.filters
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
        },
        //Get information from CRUD form
        crudInfo(){
          return this.$store.state.qcrudComponent.component[this.crudId] || {}
        }
      },
    }
  </script>
  ```
  
  > Note: the computed `crudInfo` has all form fields values. this is available to can validate prop `vIf` or rules.
  too has a additional field named `typeForm` to validate if form is "create" or "update" 
    
- #### Format to fields
  With this format can create fields to use in `filters`, `fomrLeft` and `formRight`
    
    ```js
      let configField = {
        value: 'value',//Default Value to field
        name: '',//Set field name [options, by default set name of field]
        type: `[crud,input,search,date,hour,select,html,multiSelect,checkbox,image,media,permissions,settings]`,
        isTranslatable : Booblean, //Set field as translatable
        isFakeField: true,//Define if field is a fake field
        noCrud: true,//If is true, this field will no send as form
        props : {//All props accepted to field
          label: `${this.$tr('ui.label.role')}`,
          rules : [], //rules to validate field
          vIf : true,//to load or no this field
          options: [ //Options to load only in type [select, multiSelect]
            {label: this.$tr('ui.label.all'), id: '0'}
          ],
          crudType : [select, button-create, full], //type of load crud, default it's select
          crudData : import('path-crud'),
          crudProps : {},//Props to crud component
          //To load media type
          zone : 'name', //Filed only to use with type [media]
          entity : 'name', //Filed only to use with type [media]
          entityId : 'name', //Filed only to use with type [media]
        },
        loadOptions: { //Async load options form request, only in types [select, multiSelect]
          apiRoute: 'apiRoutes.quser.roles', //apiRoute to request
          select: {label: 'name', id: 'id'}, //Define fields to config select
          delayed : () => {} //Load async options
        },
        validateField : {//Validate if value of field exist [tested only in `input` type]
          apiRoute: 'api-route-name',//Required
          requestParams : {},//Request params
          crudId : this.crudId//<int> Default rule to validate when is with crud
        }     
      }
    ```      
    
  When the `crud.vue` file has been created, you just use the `<crud>` component (this component is registered globally 
  for use) and set the necesary props.
  
- #### API  
  | Prop | type |Description |
  | --------- | ---------- | -------- |
  | `type` | `String` | Define load type to component between [select, button-create, full]. "full" type it's default |
  | `crud-data` | `import('path')` | Import with config to CRUD |
  | `crud-props` | `Object` | Object with props to component |
  | `config` | `Object` | Object with config to component like [requestParams, options] |
  | `custom-data` | `Object` | Replace information from `crud.vue` file |
  
  | Event | Description |
  | --------- | ---------- |
  | `@created` | Dispath when item was create |
  | `@updated` | Dispath when item was update |
  
  | Method | Description |
  | --------- | ---------- |
  | `create({})` | You can set prop `type` as `none` to hide component, and call this method to open modal with creation form, extra you can set a Object with data to change form data |
  | `update(itemId)` | You can set prop `type` as `none` to hide component, and call this method to open modal with edition form |
    
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
