import {format} from 'date-fns'
import exportFromJSON from 'export-from-json'
import {alert} from '../../../../src/plugins/alert'
import {required, email, sameAs, minLength} from 'vuelidate/lib/validators';
import _pick from 'lodash.pick'
import departmentService from "../../../user/_services/departments";



export const crudActions = {
  permission: 'fhia.departments',
  actionsData:{
    add: {
      icon: 'add',
      tooltip: '',
      //permission:''
    },
    export: {
      icon: 'fas fa-download',
      tooltip: '',
      //permission:''
    },
    delete: {
      icon: 'delete',
      tooltip: '',
      //permission:''
    },
    edit: {
      icon: 'edit',
      tooltip: '',
      //permission:''
    }
  }
  
}



/**
 *
 * @type {{inline: null, headers: *[], formatters: (function(*, *): *)}}
 */
export const crudTable = {
  headers: [
    { text: 'Title', value: 'title' },
    { text: 'Updated At', value: 'updated_at' },
    { text: 'Created At', value: 'created_at' }
  ]

}

/**
 *
 * @type {{
 * fieldsData: {
 *  db_column: {
 *    type: 'text' or 'select',
 *    label: string,
 *    name: string,
 *    placeHolder: string,
 *    multiple: boolean,
 *    filter: boolean,
 *    chips: boolean,
 *    radio: boolean,
 *    options: [
 *      {
 *        label: string,
 *        icon: string,
 *        value: string or integer
 *      }
 *    optionsFn: async function,
 *    viewPosition: 'left' or 'right',
 *    value: string or integer,
 *    rules: { vuelidate rules }
 *  }
 * }
 * }}
 *
 */
export const crudFields = {
  fieldsData:{
    title: {
      type: 'text',
      label: 'Department Title',
      name: 'title',
      placeHolder: '',
      viewPosition: 'left',
      rules: {
        required,
      }
    }
  }
}


/**
 *
 * @type {{
 * FilterVue: (function(): {}),
 * filterData: {
 *  filterName: {
 *    type: 'text' or 'select',
 *    label: string,
 *    name: string,
 *    placeHolder: string,
 *    multiple: boolean,
 *    filter: boolean,
 *    chips: boolean,
 *    radio: boolean,
 *    options: [
 *      {
 *        label: string,
 *        icon: string,
 *        value: string or integer
 *      }
 *    optionsFn: async function,
 *    viewPosition: 'left' or 'right',
 *    value: string or integer,
 *    rules: { vuelidate rules }
 *  }
 * }
 * }}
 *
 */
export const crudFilter = {
  FilterVue: () => ({ // you can set your custom filter view
    //component: import('./departmentFilter.vue')
  }),
  filterData: {
    search: {
      type: 'text',
      label:'',
      placeHolder: 'Text Search',
      value: '',
      cols:'4'
    }
  }
}


/**
 *
 * @type {{FormVue: (function(): {}), defaultRec: (function(): {})}}
 */
export const crudForm = {
  FormVue: () => ({
    //component: import('./configurationForm.vue')
  }),
  defaultRec: () => ({ // here you can put de initial values for the record
    title: ''
  })
}


export const crudOps = { // CRUD
  export: async (payload) => {
    const {filterData,crudTable} = payload // pagination
    let filter = {};
    for (var key in filterData)
      filter[key] = filterData[key].value
  
    let headers = []
    crudTable.headers.forEach(element => {
      headers.push(element.value);
    })
    console.log("headers", headers)
  
    let headerData = [];
    await departmentService.index(filter)
      .then((response) =>{
      
        response.data.forEach((element,index) => {
        
          headerData.push(_pick(element, headers))
        })
      
        const data = headerData
        const fileName = 'Departments'
        const exportType = 'xls'
        exportFromJSON({ data, fileName, exportType })
      })
      .catch((error) => {
        let errorMessage = error.response.data.error ? error.response.data.error : 'No Departments found';
        alert.error(errorMessage, 'bottom')
      })
  },
  
  delete: async (payload) => {
    let {id, ...attributes} = payload

    await departmentService.delete(id)
      .then((response) => {
        alert.success('Department Deleted', 'top')
      }).catch(error => {
        let errorMessage = error.response.data.error ? error.response.data.error : 'Delete failed';
        alert.error(errorMessage, 'bottom')
      })

  },
  
  index: async (payload) => {
    let data = []
    const {pagination, filterData} = payload
    let filter = {};
   
    for (var key in filterData)
      filter[key] = filterData[key].value
    
    
      let page = pagination.page ? pagination.page : 1;
      
      await departmentService.index(filter,10,page)
        .then((response) => {
          data = response;
      }).catch(error => {
        let errorMessage = error.response.data.error ? error.response.data.error : 'No departments found';
        alert.error(errorMessage, 'bottom')
      })
    return {records:data.data,pagination:data.meta}
  },
  
  
  show: async (payload) => {
    const {id} = payload
    let record = { }
    let fields = 'id,title,updated_at,created_at'
    await departmentService.show(id,null,fields)
      .then((response) => {
        record = response.data;
      }).catch(error => {
        let errorMessage = error.response.data.error ? error.response.data.error : 'department not found';
        alert.error(errorMessage, 'bottom')
      })
    return record
  },
  
  
  create: async (payload) => {
    const {record: {id, ...attributes}} = payload
    let data = {
      attributes: attributes
    }
    await departmentService.create(data)
      .then((response) => {
        alert.success('Department Created', 'top')
      }).catch(error => {
        let errorMessage = error.response.data.error ? error.response.data.error : 'Create failed';
        alert.error(errorMessage, 'bottom')
      })

  },
  
  update: async (payload) => {
    let {record: {id, ...attributes}} = payload
    let data = {
      id: id,
      attributes:attributes
    }
    await departmentService.update(data,data.id)
      .then((response) => {
        alert.success('Department Updated', 'top')
      }).catch(error => {
        let errorMessage = error.response.data.error ? error.response.data.error : 'Update failed';
        alert.error(errorMessage, 'bottom')
      })
    
  }
  
}
