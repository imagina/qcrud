<template>
  <div id="componentCrudIndex">
    <!--Content-->
    <div class="backend-page">
      <!--Data-->
      <div class="relative-position col-12" v-if="success">
        <!--Table-->
        <q-table
          :data="table.data"
          :columns="params.read.columns"
          :pagination.sync="table.pagination"
          @request="getData"
          :filter="table.filter"
          class="box-table"
          :hide-header="!showSlotTable.header"
          :hide-bottom="!showSlotTable.bottom"
        >
          <!--Slot Top-->
          <template slot="top">
            <!--Table slot left-->
            <div class="table-top-left col-12 col-md-4 col-xl-3">
              <!--Search-->
              <q-search hide-underline clearable v-model="table.filter.search"
                        @input="getDataTable" class="q-my-xs" v-if="params.read.search !== false"/>
              <!--Title-->
              <div class="q-title text-primary ellipsis" v-if="params.read.title || params.read.icon">
                <q-icon v-if="params.read.icon" class="q-mr-sm" :name="params.read.icon"/>
                <span v-if="params.read.title" :title="params.read.title">
                  {{params.read.title}}
                </span>
              </div>
            </div>
            <!--Table slot Right-->
            <div class="table-top-right col-12 col-md-8 col-xl-9 text-right">
              <!--Button new record-->
              <q-btn icon="fas fa-edit" :label="params.create.title"
                     :to="params.create.to ? {name : params.create.to} : {}"
                     @click="params.create.to ? false : $emit('create')"
                     color="positive" class="q-my-xs"
                     v-if="params.create && params.hasPermission.create"/>
              <!--Button toggle filters-->
              <q-btn icon="fas fa-filter" color="primary" :label="$trp('ui.label.filter')"
                     :icon-right="`fas fa-${filter.show ? 'caret-up' : 'caret-down'}`"
                     @click="filter.show = !filter.show" class="q-ml-xs" v-if="filter.available"/>
              <!--Button refresh data-->
              <q-btn icon="fas fa-sync-alt" color="info" class="q-ml-xs"
                     @click="getDataTable(true)">
                <q-tooltip :delay="300">{{$tr('ui.label.refresh')}}</q-tooltip>
              </q-btn>
            </div>
            <!--Filters-->
            <div v-if="filter.available" class="table-top-filters col-12 q-my-xs">
              <!--Collapsible with filters (desktop)-->
              <q-collapsible v-model="filter.show" class="q-hide q-sm-show"
                             header-style="display: none">
                <!--Product Option-->
                <div :class="`q-mr-xs ${field.type == 'select' ? 'cont-vue-tree' : ''}`"
                     v-for="(field, key) in params.read.filters">
                  <dynamic-field v-model="table.filter[field.name || key]" :key="field.name || key"
                                 @input="getDataTable" :field="field"/>
                </div>
              </q-collapsible>
              <!--Modal with filters (Movile)-->
              <q-modal v-model="filter.show" class="q-sm-hide backend-page">
                <q-modal-layout>
                  <!--Header-->
                  <q-toolbar slot="header">
                    <q-toolbar-title class="capitalize">
                      <q-icon name="fas fa-filter" class="q-mr-sm"/>
                      {{$trp('ui.label.filter')}}
                    </q-toolbar-title>
                    <q-btn flat v-close-overlay icon="fas fa-times"/>
                  </q-toolbar>

                  <!--Footer-->
                  <q-toolbar slot="footer" color="white">
                    <q-toolbar-title></q-toolbar-title>
                    <!--Button Save-->
                    <q-btn icon="fas fa-times" color="positive" :label="$tr('ui.label.close')"
                           :loading="loading" @click="filter.show = false"/>
                  </q-toolbar>

                  <!--Content-->
                  <div class="layout-padding relative-position">
                    <!--load dynamic fields-->
                    <dynamic-field v-for="(field, key) in params.read.filters"
                                   v-model="table.filter[field.name || key]" :key="field.name || key"
                                   @input="getDataTable" :field="field"/>
                  </div>
                </q-modal-layout>
              </q-modal>
            </div>
          </template>
          <!--= Custom Columns =-->
          <q-td slot="body-cell-actions" slot-scope="props" :props="props">
            <!--Edit button-->
            <q-btn color="positive" icon="fas fa-pen" size="sm"
                   v-if="permitAction(props.row).edit"
                   :to="params.update.to ? {name : params.update.to, params : {id : props.row.id}} : {}"
                   @click="params.update.to ? false : $emit('update', props.row)">
              <q-tooltip :delay="300">{{$tr('ui.label.edit')}}</q-tooltip>
            </q-btn>
            <!--Delete button-->
            <q-btn color="negative" icon="fas fa-trash-alt" size="sm" class="q-ml-xs"
                   v-if="permitAction(props.row).destroy"
                   @click="itemIdToDelete = props.row; dialogDeleteItem = true">
              <q-tooltip :delay="300">{{$tr('ui.label.delete')}}</q-tooltip>
            </q-btn>
            <!-- Custom Actions -->
            <q-btn v-for="(action, key) in params.read.actions" size="sm"
                   v-if="params.read.actions" :key="key" class="q-ml-xs"
                   :icon="action.icon || ''" :color="action.color || ''"
                   @click="callCustomAction(action,props.row)"/>
          </q-td>
        </q-table>

        <!--Dialog to delete-->
        <q-dialog v-model="dialogDeleteItem" class="backend-page" prevent-close>
          <!-- Message -->
          <div slot="message">
            <h1 class="q-title text-negative">{{itemIdToDelete.title}}</h1>
            {{$tr('ui.message.deleteRecord')}}
          </div>

          <!--Buttons-->
          <div slot="buttons" slot-scope="props">
            <!--Button cancel-->
            <q-btn color="blue-grey" label="Cancel" @click="dialogDeleteItem = false"/>
            <!--Button confirm delete category-->
            <q-btn color="negative" icon="fas fa-trash-alt" :loading="loading"
                   label="Delete" @click="deleteItem()"/>
          </div>
        </q-dialog>

        <!--Loading-->
        <inner-loading :visible="loading"/>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      params: {default: false}
    },
    components: {},
    watch: {},
    mounted() {
      this.$nextTick(function () {
        this.init()
      })
    },
    data() {
      return {
        success: false,//Global status of component
        loading: true,//Loading
        table: {//Object config table
          data: [],
          pagination: {
            page: 1,
            rowsNumber: '',
            rowsPerPage: 10
          },
          filter: {
            search: null
          }
        },
        dialogDeleteItem: false,//VModel to show dialog to agree delete
        itemIdToDelete: false,//ID of item to delete,
        filter: {
          available: false,
          show: false,
        },
        dataField: []
      }
    },
    computed: {
      showSlotTable(){
        let data = this.$clone(this.table.data)
        let lengData = (data && data.length) ? data.length : false
        let pagination = this.$clone(this.table.pagination)

        //Order response
        let response = {
          header : lengData ? true : false,
          bottom : (pagination.rowsNumber >= pagination.rowsPerPage) ? true : (!lengData ? true : false)
        }

        return response //Response
      }
    },
    methods: {
      //init form
      async init() {
        this.success = true
        this.orderFilters()//Order filters
        this.getDataTable()//Get data
      },
      //Order filters
      orderFilters() {
        let params = this.$clone(this.params)
        //Check if there is filters
        if (params.read && params.read.filters) {
          let filters = params.read.filters
          if (Object.keys(params.read.filters).length) {
            //add filters to table filters
            Object.keys(params.read.filters).forEach(key => {
              let filter = params.read.filters[key]
              this.$set(this.table.filter, (filter.name || key), filter.value)
            })
            this.filter.available = true//allow filters
          }
        }
      },
      //Request products with params from server table
      getDataTable(refresh = false) {
        this.getData({pagination: this.table.pagination, filter: this.table.filter}, refresh)
      },
      //Get products
      getData({pagination, filter}, refresh = false) {
        let propParams = this.$clone(this.params)
        this.loading = true

        //Params to request
        let params = {
          refresh: refresh,
          params: propParams.read.requestParams || {}
        }

        //add params
        if (!params.params.filter) params.params.filter = {}
        params.params.filter = Object.assign({}, filter, params.params.filter)
        params.params.page = pagination.page
        params.params.take = pagination.rowsPerPage

        //Merge with params from prop
        if (propParams.read.params && Object.keys(propParams.read.params).length)
          Object.keys(propParams.read.params).forEach(key => {
            params.params[key] = Object.assign({}, params.params[key], propParams.read.params[key])
          })

        //Request
        this.$crud.index(propParams.apiRoute, params).then(response => {
          let dataTable = response.data

          //If is field change format
          if (this.params.field){
            dataTable = (response.data[0] && response.data[0].value) ? response.data[0].value : []
            this.dataField = response.data[0]
          }

          //Set data to table
          this.table.data = dataTable
          this.table.pagination.page = response.meta.page.currentPage
          this.table.pagination.rowsNumber = response.meta.page.total
          this.table.pagination.rowsPerPage = pagination.rowsPerPage
          this.loading = false
        }).catch(error => {
          console.error(error)
          this.$alert.error({message: this.$tr('ui.message.errorRequest'), pos: 'bottom'})
          this.loading = false
        })
      },
      //Delete category
      deleteItem() {
        this.loading = true
        let propParams = this.$clone(this.params)
        let item = this.$clone(this.itemIdToDelete)

        //If is crud field
        if (this.params.field) {
          let dataField = this.$clone(this.dataField)//get data table
          dataField.value.splice(this.itemIdToDelete.__index, 1)//Remove field

          //Request
          this.$crud.update(propParams.apiRoute, dataField.id, dataField).then(response => {
            this.$alert.success({message: this.$tr('ui.message.recordDeleted')})
            this.getDataTable(true)
            this.dialogDeleteItem = false
            this.loading = false
          }).catch(error => {
            this.$alert.error({message: this.$tr('ui.message.recordNoDeleted'), pos: 'bottom'})
            this.loading = false
          })
        } else {
          //Request
          this.$crud.delete(propParams.apiRoute, item.id).then(response => {
            this.$alert.success({message: this.$tr('ui.message.recordDeleted')})
            this.getDataTable(true)
            this.dialogDeleteItem = false
            this.loading = false
          }).catch(error => {
            this.$alert.error({message: this.$tr('ui.message.recordNoDeleted'), pos: 'bottom'})
            this.loading = false
          })
        }
      },
      //Check if permit action (delete or update)
      permitAction(field) {
        let edit = true//Default action edit
        let destroy = true//Default action destroy
        //Get options form field
        let options = (field && field.options) ?
          ((typeof field.options == 'string') ? JSON.parse(field.options) : field.options) : {}
        //Validate if field is master record
        let isMasterRecord = (options.masterRecord && parseInt(options.masterRecord)) ? true : false

        //Check to permit action edit
        if (!this.params.hasPermission.edit) edit = false//Validate entity permissions
        if (!this.params.update) edit = false//Validate if crud require update
        //Validate if record id "Master Record"
        if (isMasterRecord && !this.$auth.hasAccess('isite.master.records.edit')) edit = false

        //Check to permit action destroy
        if (!this.params.hasPermission.destroy) destroy = false//Validate entity permissions
        if (!this.params.delete) destroy = false//Validate if crud require update
        //Validate if record id "Master Record"
        if (isMasterRecord && !this.$auth.hasAccess('isite.master.records.destroy')) destroy = false

        //Response
        return {edit: edit, destroy: destroy}
      },
      //Call custom action
      callCustomAction(action, row){
        //Check if has action function
        if(action.action) action.action()
        //Check if has redirect to route
        if(action.route)
          this.$router.push({name : action.route, params : row || {}})
      }
    }
  }
</script>

<style lang="stylus">
  @import "~variables";
  #componentCrudIndex
    .q-table-container
      @media screen and (max-width: $breakpoint-sm)
        .table-top-left
          order 1

        .table-top-right
          order 2

        .table-top-filters
          order 3

    .q-collapsible
      .q-collapsible-sub-item
        padding 0px !important
</style>
