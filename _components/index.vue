<template>
  <div id="componentCrudIndex">
    <!--Content-->
    <div class="backend-page">
      <!--Data-->
      <div class="relative-position col-12" v-if="success">
        <!--Table-->
        <q-table
          :grid="table.grid"
          :data="table.data"
          :columns="tablecolumns"
          :pagination.sync="table.pagination"
          :rows-per-page-options="rowsPerPageOption"
          @request="getData"
          class="box-table stick-table"
          :hide-header="!showSlotTable.header"
        >
          <!--Slot Top-->
          <template slot="top">
            <div class="row q-col-gutter-y-sm full-width">
              <!--Table slot left-->
              <div class="table-top-left col-12 col-md-4 col-xl-3">
                <!--Search-->
                <q-input clearable v-model="table.filter.search" dense outlined debounce="800"
                         :placeholder="`${$tr('ui.label.search',{capitalize : true})}...`"
                         @input="getDataTable()" v-if="params.read.search !== false">
                  <template v-slot:append>
                    <q-icon name="search"/>
                  </template>
                </q-input>
                <!--Title-->
                <div class="text-h6 text-primary ellipsis" v-if="params.read.title || params.read.icon">
                  <q-icon v-if="params.read.icon" class="q-mr-sm" :name="params.read.icon"/>
                  <span v-if="params.read.title" :title="params.read.title">
                  {{ params.read.title }}
                </span>
                </div>
              </div>
              <!--Table slot Right-->
              <div class="table-top-right col-12 col-md-8 col-xl-9 text-right">
                <div class="row q-gutter-xs justify-end">
                  <!-- Custom Actions -->
                  <q-btn v-for="(action, key) in (params.read.globalActions || {})" :key="key"
                         v-if="action.vIf ? action.vIf : true"
                         :icon="action.icon || ''" :color="action.color || ''"
                         style="font-size: 8px; padding: 6px" round unelevated
                         @click="callCustomAction(action,false,key)">
                    <q-tooltip v-if="action.tooltip">{{ action.tooltip }}</q-tooltip>
                  </q-btn>
                  <!--Toggle view as grid-->
                  <q-btn round unelevated size="12px" style="font-size: 8px; padding: 6px"
                         color="light-blue" @click="table.grid = !table.grid"
                         :icon="!table.grid ? 'fas fa-grip-horizontal' : 'fas fa-list-ul'">
                    <q-tooltip>{{ $tr(`ui.message.${table.grid ? 'listView' : 'gribView'}`) }}</q-tooltip>
                  </q-btn>
                  <!--Button new record-->
                  <q-btn icon="fas fa-plus" round unelevated size="12px" style="font-size: 8px; padding: 6px"
                         v-if="params.create && params.hasPermission.create" color="positive"
                         v-bind="params.create.to ? {to : params.create.to} : {}"
                         @click="params.create.to ? false : $emit('create')">
                    <q-tooltip>{{ params.create.title }}</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
          </template>

          <!--Custom columns-->
          <template v-slot:body-cell="props">
            <!-- actions columns -->
            <q-td v-if="props.col.name == 'actions'" :props="props">
              <div class="full-width" style="width : max-content">
                <!-- Custom Actions -->
                <q-btn v-for="(action, key) in (params.read.actions || {})" size="sm"
                       v-if="action.vIf ? action.vIf : true" :key="key"
                       :icon="action.icon || ''" :color="action.color || ''"
                       style="font-size: 8px; padding: 6px" round unelevated
                       @click="callCustomAction(action,props.row,key)">
                  <q-tooltip v-if="action.tooltip">{{ action.tooltip }}</q-tooltip>
                </q-btn>
                <!--Edit button-->
                <q-btn color="positive" icon="fas fa-pen" size="sm" style="font-size: 8px; padding: 6px"
                       v-if="permitAction(props.row).edit" round unelevated class="q-ml-xs"
                       v-bind="params.update.to ? {to : {name : params.update.to, params : props.row}} : {}"
                       @click="params.update.to ? false : $emit('update', props.row)">
                  <q-tooltip :delay="300">{{ $tr('ui.label.edit') }}</q-tooltip>
                </q-btn>
                <!--Delete button-->
                <q-btn color="negative" icon="fas fa-trash-alt" size="sm" class="q-ml-xs"
                       v-if="permitAction(props.row).destroy" round unelevated
                       style="font-size: 8px; padding: 6px"
                       @click="()=>{itemIdToDelete = props.row; dialogDeleteItem = true}">
                  <q-tooltip :delay="300">{{ $tr('ui.label.delete') }}</q-tooltip>
                </q-btn>
              </div>
            </q-td>
            <!-- status columns -->
            <q-td v-else-if="(['status','active'].indexOf(props.col.name) != -1) || props.col.asStatus"
                  :props="props" class="text-left">
              <q-btn-dropdown :color="props.value ? 'positive' : 'negative'" flat padding="sm none" class="text-caption"
                              :label="props.value ? $tr('ui.label.enabled') : $tr('ui.label.disabled')" no-caps>
                <!--Message change to-->
                <q-item class="q-pa-sm cursor-pointer" @click.native="updateStatus(props)" v-close-popup>
                  <div class="row items-center">
                    <q-icon name="fas fa-pen" class="q-mr-sm" :color="!props.value ? 'positive' : 'negative'"/>
                    {{
                      $tr('ui.message.changeTo', {text: (props.value ? $tr('ui.label.disabled') : $tr('ui.label.enabled'))})
                    }}
                  </div>
                </q-item>
              </q-btn-dropdown>
            </q-td>
            <!--Default columns-->
            <q-td v-else :props="props" :title="props.value">
              {{ props.value }}
            </q-td>
          </template>

          <!--Custom cards-->
          <template v-slot:item="props">
            <div class="q-pa-sm col-12 col-sm-6 col-md-4 col-lg-3">
              <q-card flat bordered>
                <q-list dense>
                  <q-item v-for="col in props.cols" :key="col.name">
                    <q-item-section>
                      <!--Field name-->
                      <q-item-label class="ellipsis">
                        <div v-if="col.name != 'actions'">
                          {{ col.label }} {{ col.name == 'id' ? col.value : '' }}
                        </div>
                        <q-separator v-if="['id','actions'].indexOf(col.name) != -1" class="q-mt-sm"/>
                      </q-item-label>
                      <!--Field value-->
                      <q-item-label v-if="col.name != 'id'" class="ellipsis text-grey-6">
                        <!-- actions columns -->
                        <div v-if="col.name == 'actions'" :props="props" class="row q-gutter-x-xs justify-end q-py-xs">
                          <!-- Custom Actions -->
                          <q-btn v-for="(action, key) in (params.read.actions || {})" size="sm"
                                 v-if="action.vIf ? action.vIf : true" :key="key"
                                 :icon="action.icon || ''" :color="action.color || ''"
                                 style="font-size: 8px; padding: 6px" round unelevated
                                 @click="callCustomAction(action,props.row,key)">
                            <q-tooltip v-if="action.tooltip">{{ action.tooltip }}</q-tooltip>
                          </q-btn>
                          <!--Edit button-->
                          <q-btn color="positive" icon="fas fa-pen" size="sm" style="font-size: 8px; padding: 6px"
                                 v-if="permitAction(props.row).edit" round unelevated
                                 v-bind="params.update.to ? {to : {name : params.update.to, params : props.row}} : {}"
                                 @click="params.update.to ? false : $emit('update', props.row.id)">
                            <q-tooltip :delay="300">{{ $tr('ui.label.edit') }}</q-tooltip>
                          </q-btn>
                          <!--Delete button-->
                          <q-btn color="negative" icon="fas fa-trash-alt" size="sm"
                                 v-if="permitAction(props.row).destroy" round unelevated
                                 style="font-size: 8px; padding: 6px"
                                 @click="()=>{itemIdToDelete = props.row; dialogDeleteItem = true}">
                            <q-tooltip :delay="300">{{ $tr('ui.label.delete') }}</q-tooltip>
                          </q-btn>
                        </div>
                        <!-- status columns -->
                        <div v-else-if="(['status','active'].indexOf(col.name) != -1) || col.asStatus"
                             class="text-left">
                          <q-btn-dropdown :color="col.value ? 'positive' : 'negative'" flat padding="sm none"
                                          class="text-caption"
                                          :label="col.value ? $tr('ui.label.enabled') : $tr('ui.label.disabled')"
                                          no-caps>
                            <!--Message change to-->
                            <q-item class="q-pa-sm cursor-pointer" @click.native="updateStatus(props)" v-close-popup>
                              <div class="row items-center">
                                <q-icon name="fas fa-pen" class="q-mr-sm"
                                        :color="!col.value ? 'positive' : 'negative'"/>
                                {{
                                  $tr('ui.message.changeTo', {text: (col.value ? $tr('ui.label.disabled') : $tr('ui.label.enabled'))})
                                }}
                              </div>
                            </q-item>
                          </q-btn-dropdown>
                        </div>
                        <!--Default columns-->
                        <div v-else> {{ col.value }}</div>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </div>
          </template>
        </q-table>

        <!--Dialog to delete-->
        <q-dialog v-model="dialogDeleteItem">
          <q-card class="backend-page">
            <q-card-section>
              <h5 class="q-ma-none text-negative">{{ itemIdToDelete.title }}</h5>
              {{ $tr('ui.message.deleteRecord') }}
            </q-card-section>

            <q-card-actions align="right">
              <!--Button cancel-->
              <q-btn color="blue-grey" label="Cancel" @click="dialogDeleteItem = false" unelevated rounded/>
              <!--Button confirm delete category-->
              <q-btn color="negative" icon="fas fa-trash-alt" :loading="loading"
                     label="Delete" @click="deleteItem()" unelevated rounded/>
            </q-card-actions>
          </q-card>
        </q-dialog>

        <!--Loading-->
        <inner-loading :visible="loading"/>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  beforeDestroy() {
    this.$root.$off('page.data.refresh')
  },
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
        },
        grid: false
      },
      statusModel: {},//Model to status
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
    showSlotTable() {
      let data = this.$clone(this.table.data)
      let lengData = (data && data.length) ? data.length : false
      let pagination = this.$clone(this.table.pagination)

      //Order response
      let response = {
        header: lengData ? true : false,
        bottom: (pagination.rowsNumber >= pagination.rowsPerPage) ? true : (!lengData ? true : false)
      }

      return response //Response
    },
    //Options rows per page
    rowsPerPageOption() {
      return this.params.read.rowsPerPageOptions || [5, 10, 20, 50, 100, 300, 500]
    },
    //return table columns
    tablecolumns() {
      let columns = this.$clone(this.params.read.columns)
      //Check columns
      columns.forEach(column => {
        //Default sort by id
        if (['id', 'created_at', 'updated_at'].indexOf(column.name) != -1) column.sortable = true
        //Validate column actions
        if (column.name == 'actions') column.align = 'right'
        //Add format to status column
        if ((['status', 'active'].indexOf(column.name) != -1) || column.asStatus) {
          column.format = val => Number.isInteger(parseInt(val)) ? parseInt(val) : 0
        }
      })

      return columns
    }
  },
  methods: {
    //init form
    async init() {
      await this.orderFilters()//Order filters
      this.$root.$on('page.data.refresh', () => this.getDataTable(true))//Listen refresh event
      if (!this.params.read.filterName) this.getDataTable()//Get data
      //Emit mobile main action
      if (this.params.mobileAction && this.params.create && this.params.hasPermission.create) {
        this.$eventBus.$emit('setMobileMainAction', {
          icon: 'fas fa-plus',
          color: 'green',
          callBack: () => {
            this.params.create.to ? this.$router.push(this.params.create.to) : this.$emit('create')
          }
        })
      }
      this.success = true
    },
    //Order filters
    orderFilters() {
      return new Promise(async (resolve, reject) => {
        let params = this.$clone(this.params)
        //Load master filter
        if (params.read) {
          if (params.read.filterName || params.read.filters) {
            await this.$filter.setFilter({
              name: params.read.filterName || this.$route.name,
              fields: this.$clone(params.read.filters || {}),
              callBack: () => {
                this.table.filter = this.$clone(this.$filter.values)
                this.getDataTable(true, this.$clone(this.$filter.values), this.$clone(this.$filter.pagination))
              }
            })
          }
        }

        //Load local filters
        if (params.read && params.read.filters) {
          let filters = params.read.filters
          if (Object.keys(params.read.filters).length) {
            //add filters to table filters
            Object.keys(params.read.filters).forEach(key => {
              let filter = params.read.filters[key]
              this.$set(this.table.filter, (filter.name || key), filter.value)
            })
            if (!this.params.read.filterName) this.filter.available = true//allow filters
          }
        }
        //Resolve
        resolve(true)
      })
    },
    //Request products with params from server table
    async getDataTable(refresh = false, filter = false, pagination = false) {
      //Call data table
      this.getData({
          pagination: {...this.table.pagination, ...(pagination || {})},
          filter: {...this.table.filter, ...(filter || {})}
        },
        refresh)
    },
    //Get products
    getData({pagination, filter}, refresh = false) {
      let propParams = this.$clone(this.params)
      this.loading = true

      //Refresh all data
      if (refresh) this.$cache.remove({allKey: this.params.apiRoute})

      //Params to request
      let params = {
        refresh: refresh,
        params: propParams.read.requestParams || {}
      }

      //add params
      if (!params.params.filter) params.params.filter = {}
      params.params.filter = {...params.params.filter, ...this.table.filter, ...filter}
      params.params.page = pagination.page
      params.params.take = pagination.rowsPerPage

      //Set order by
      if (pagination.sortBy) {
        params.params.filter.order = {
          field: pagination.sortBy,
          way: pagination.descending ? 'desc' : 'asc'
        }
      }

      //Merge with params from prop
      if (propParams.read.params && Object.keys(propParams.read.params).length) {
        Object.keys(propParams.read.params).forEach(key => {
          params.params[key] = Object.assign({}, params.params[key], propParams.read.params[key])
        })
      }

      //Request
      this.$crud.index(propParams.apiRoute, params).then(response => {
        let dataTable = response.data

        //If is field change format
        if (this.params.field) {
          dataTable = (response.data[0] && response.data[0].value) ? response.data[0].value : []
          this.dataField = response.data[0]
        }

        //Set data to table
        this.table.data = this.$clone(dataTable)
        this.table.pagination.page = this.$clone(response.meta.page.currentPage)
        this.table.pagination.rowsNumber = this.$clone(response.meta.page.total)
        this.table.pagination.rowsPerPage = this.$clone(pagination.rowsPerPage)
        this.table.pagination.sortBy = this.$clone(pagination.sortBy)
        this.table.pagination.descending = this.$clone(pagination.descending)

        //Sync master filter
        if (this.params.read.filterName) {
          //Set search param
          this.$filter.addValues({search: params.params.filter.search})
          //Set pagination
          this.$filter.setPagination({
            page: this.$clone(response.meta.page.currentPage),
            rowsPerPage: this.$clone(response.meta.page.perPage),
            lastPage: this.$clone(response.meta.page.lastPage),
          })
          //Sync local
          this.table.filter.search = this.$clone(params.params.filter.search)
        }

        this.loading = false
      }).catch(error => {
        this.$alert.error({message: this.$tr('ui.message.errorRequest'), pos: 'bottom'})
        console.error(error)
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
          this.$alert.info({message: this.$tr('ui.message.recordDeleted')})
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
          this.$alert.info({message: this.$tr('ui.message.recordDeleted')})
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
      if (isMasterRecord && !this.$store.getters['quserAuth/hasAccess']('isite.master.records.edit')) edit = false

      //Check to permit action destroy
      if (!this.params.hasPermission.destroy) destroy = false//Validate entity permissions
      if (!this.params.delete) destroy = false//Validate if crud require update
      //Validate if record id "Master Record"
      if (isMasterRecord && !this.$store.getters['quserAuth/hasAccess']('isite.master.records.destroy')) destroy = false

      //Response
      return {edit: edit, destroy: destroy}
    },
    //Call custom action
    async callCustomAction(action, row, key = false) {
      //Check if has action function
      if (action.action) {
        this.loading = true
        await action.action(row)
        this.loading = false
      }
      //Check if has redirect to route
      if (action.route) {
        this.$router.push({name: action.route, params: row || {}})
      }
    },
    //Update item status
    updateStatus(item) {
      this.loading = true
      //Request Data
      let requestData = {id: item.row.id}
      requestData[item.col.name] = item.row[item.col.name] ? 0 : 1

      //Request
      this.$crud.update(this.params.apiRoute, item.row.id, requestData).then(response => {
        //Change value status in data
        this.table.data = this.$clone(this.table.data.map(itemData => {
          //Change status
          if (itemData.id == item.row.id) itemData[item.col.name] = !item.row[item.col.name]
          return itemData//Response
        }))
        this.loading = false
        this.$alert.info({message: this.$tr('ui.message.recordUpdated')})
      }).catch(error => {
        this.loading = false
        this.$alert.error({message: this.$tr('ui.message.recordNoUpdated')})
      })
    }
  }
}
</script>

<style lang="stylus">
#componentCrudIndex
  .q-table-container
    @media screen and (max-width: $breakpoint-sm)
      .table-top-left
        order 1

      .table-top-right
        order 2

  .stick-table
    th:last-child, td:last-child
      background-color white
      position: sticky
      right: 0
      z-index: 1

    th:first-child, td:first-child
      background-color white
      position: sticky
      left: 0
      z-index: 1

#dialogFilters
  min-height max-content !important
</style>
