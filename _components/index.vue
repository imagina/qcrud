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
          :rows-per-page-options="rowsPerPageOption"
          @request="getData"
          class="box-table"
          :hide-header="!showSlotTable.header"
        >
          <!--Slot Top-->
          <template slot="top">
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
                  {{params.read.title}}
                </span>
              </div>
            </div>
            <!--Table slot Right-->
            <div class="table-top-right col-12 col-md-8 col-xl-9 text-right">
              <!--Button new record-->
              <q-btn icon="fas fa-plus" round unelevated size="12px" style="font-size: 10px; padding: 6px"
                     v-bind="params.create.to ? {to : params.create.to} : {}"
                     @click="params.create.to ? false : $emit('create')"
                     color="positive" class="q-my-xs"
                     v-if="params.create && params.hasPermission.create">
                <q-tooltip>{{params.create.title}}</q-tooltip>
              </q-btn>
              <!--Button toggle filters-->
              <q-btn icon="fas fa-filter" color="primary" class="q-ml-xs" size="12px"
                     style="font-size: 10px; padding: 6px" @click="filter.show = !filter.show"
                     v-if="false && filter.available"
                     round unelevated>
                <q-tooltip>{{$trp('ui.label.filter')}}</q-tooltip>
              </q-btn>
              <!--Button refresh data-->
              <q-btn icon="fas fa-sync-alt" color="info" class="q-ml-xs" size="12px" v-if="params.read.refresh"
                     @click="getDataTable(true)" round unelevated style="font-size: 10px; padding: 6px">
                <q-tooltip :delay="300">{{$tr('ui.label.refresh')}}</q-tooltip>
              </q-btn>
            </div>
          </template>

          <!--Custom columns-->
          <template v-slot:body-cell="props">
            <!-- actions columns -->
            <q-td v-if="props.col.name == 'actions'" :props="props">
              <!--Edit button-->
              <q-btn color="positive" icon="fas fa-pen" size="sm" style="font-size: 8px; padding: 6px"
                     v-if="permitAction(props.row).edit" round unelevated
                     v-bind="params.update.to ? {to : {name : params.update.to, params : props.row}} : {}"
                     @click="params.update.to ? false : $emit('update', props.row.id)">
                <q-tooltip :delay="300">{{$tr('ui.label.edit')}}</q-tooltip>
              </q-btn>
              <!--Delete button-->
              <q-btn color="negative" icon="fas fa-trash-alt" size="sm" class="q-ml-xs"
                     v-if="permitAction(props.row).destroy" round unelevated
                     style="font-size: 8px; padding: 6px"
                     @click="()=>{itemIdToDelete = props.row; dialogDeleteItem = true}">
                <q-tooltip :delay="300">{{$tr('ui.label.delete')}}</q-tooltip>
              </q-btn>
              <!-- Custom Actions -->
              <q-btn v-for="(action, key) in params.read.actions" size="sm"
                     v-if="params.read.actions" :key="key" class="q-ml-xs"
                     :icon="action.icon || ''" :color="action.color || ''"
                     style="font-size: 8px; padding: 6px" round unelevated
                     @click="callCustomAction(action,props.row)">
                <q-tooltip v-if="action.tooltip">{{action.tooltip}}</q-tooltip>
              </q-btn>
            </q-td>
            <!-- status columns -->
            <q-td v-if="(['status','active'].indexOf(props.col.name) != -1) || props.col.asStatus"
                  :props="props" class="text-left">
              <q-btn-dropdown :color="props.value ? 'positive' : 'negative'" flat padding="sm none" class="text-caption"
                              :label="props.value ? $tr('ui.label.enabled') : $tr('ui.label.disabled')" no-caps>
                <!--Message change to-->
                <q-item class="q-pa-sm cursor-pointer" @click.native="updateStatus(props)" v-close-popup>
                  <div class="row items-center">
                    <q-icon name="fas fa-pen" class="q-mr-sm" :color="!props.value ? 'positive' : 'negative'"/>
                    {{ $tr( 'ui.message.changeTo', {text : (props.value ? $tr('ui.label.disabled') :
                    $tr('ui.label.enabled'))}) }}
                  </div>
                </q-item>
              </q-btn-dropdown>
            </q-td>
            <!--Default columns-->
            <q-td v-else :props="props" :title="props.value">
              {{props.value}}
            </q-td>
          </template>
        </q-table>

        <!--Dialog to delete-->
        <q-dialog v-model="dialogDeleteItem">
          <q-card class="backend-page">
            <q-card-section>
              <h5 class="q-ma-none text-negative">{{itemIdToDelete.title}}</h5>
              {{$tr('ui.message.deleteRecord')}}
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
          }
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
      rowsPerPageOption(){
        return this.params.read.rowsPerPageOptions || [5,10,20,50,100]
      }
    },
    methods: {
      //init form
      async init() {
        await this.orderFilters()//Order filters
        this.$root.$on('page.data.refresh', () => this.getDataTable(true))//Listen refresh event
        if (!this.params.read.filterName) this.getDataTable()//Get data
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
          params.params.filter.order.field = pagination.sortBy
          params.params.filter.order.way = pagination.descending ? 'desc' : 'asc'
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
      callCustomAction(action, row) {
        //Check if has action function
        if (action.action) action.action(row)
        //Check if has redirect to route
        if (action.route) {
          this.$router.push({name: action.route, params: row || {}})
        }
      },
      //Update item status
      updateStatus(item) {
        this.loading = true
        //Request Data
        let requestData = {id : item.row.id}
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

        .table-top-filters
          order 3

  #dialogFilters
    min-height max-content !important
</style>
