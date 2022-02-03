<template>
  <div id="componentCrudIndex">
    <!--Content-->
    <div class="backend-page">
      <!--Data-->
      <div class="relative-position col-12" v-if="success">
        <!--Table-->
        <q-table :grid="table.grid" :data="table.data" :columns="tableColumns" :pagination.sync="table.pagination"
                 :rows-per-page-options="rowsPerPageOption" @request="getData" class="stick-table"
                 ref="tableComponent" card-container-class="q-col-gutter-md">
          <!--Slot Top-->
          <template slot="top" v-if="showSlotTable.header">
            <!--Page Actions-->
            <page-actions :extra-actions="tableActions"
                          :title="(title || params.read.title) ? (title || params.read.title) : ''"
                          @search="val => {table.filter.search = val; getDataTable()}" @new="handlerActionCreate()"/>
          </template>

          <!--Custom columns-->
          <template v-slot:body-cell="props">
            <!-- actions columns -->
            <q-td v-if="props.col.name == 'actions'" :props="props">
              <btn-menu :actions="fieldActions(props)" :action-data="props.row"/>
            </q-td>
            <!-- status columns -->
            <q-td v-else-if="(['status','active'].indexOf(props.col.name) != -1) || props.col.asStatus"
                  :props="props" class="text-left">
              <!--Action-->
              <q-btn-dropdown :color="props.value ? 'green' : 'red'" flat padding="sm none" class="text-caption"
                              :label="props.value ? $tr('ui.label.enabled') : $tr('ui.label.disabled')" no-caps
                              v-if="permitAction(props.row).edit">
                <!--Message change to-->
                <q-item class="q-pa-sm cursor-pointer" @click.native="updateStatus(props)" v-close-popup>
                  <div class="row items-center">
                    <q-icon name="fas fa-pen" class="q-mr-sm" :color="!props.value ? 'green' : 'red'"/>
                    {{
                      $tr('ui.message.changeTo', {text: (props.value ? $tr('ui.label.disabled') : $tr('ui.label.enabled'))})
                    }}
                  </div>
                </q-item>
              </q-btn-dropdown>
              <!--Label-->
              <label v-else>{{ props.value ? $tr('ui.label.disabled') : $tr('ui.label.enabled') }}</label>
            </q-td>
            <!--Default columns-->
            <q-td v-else :props="props" :title="props.value">
              {{ props.value }}
            </q-td>
          </template>

          <!--Custom cards-->
          <template v-slot:item="props">
            <div :class="`${gridParams.colClass}`">
              <!--Card Component-->
              <component v-if="gridParams.component" :is="gridParams.component" :row="props.row"
                         :permit-action="permitAction(props.row)" :field-actions="fieldActions(props)"
                         @update="params.update.to ? false : $emit('update', props.row)"
                         @delete="deleteItem(props.row)"/>
              <!--Default Card -->
              <q-card v-else flat class="box default-card-grid" style="padding-top: 5px">
                <!--item image-->
                <div class="default-card-grid_item-image" v-if="itemImage(props.row)"
                     :style="`background-image: url('${itemImage(props.row)}')`"></div>
                <!--Fields-->
                <q-list dense>
                  <q-item v-for="col in props.cols" :key="col.name" style="padding: 3px 0" v-if="col.name != 'actions'">
                    <q-item-section>
                      <!--Field name-->
                      <q-item-label class="ellipsis">
                        <div v-if="col.name != 'actions'" class="row justify-between items-center">
                          <!--Label-->
                          <div> {{ col.label }} {{ col.name == 'id' ? col.value : '' }}</div>
                          <!--Actions-->
                          <btn-menu v-if="col.name == 'id'" :actions="fieldActions(props)" :action-data="props.row"/>
                        </div>
                        <q-separator v-if="['id'].indexOf(col.name) != -1" class="q-mt-sm"/>
                      </q-item-label>
                      <!--Field value-->
                      <q-item-label v-if="col.name != 'id'" class="ellipsis text-grey-6">
                        <!-- status columns -->
                        <div v-if="(['status','active'].includes(col.name)) || col.asStatus"
                             class="text-left">
                          <q-btn-dropdown :color="col.value ? 'green' : 'red'" flat padding="sm none"
                                          :label="col.value ? $tr('ui.label.enabled') : $tr('ui.label.disabled')"
                                          class="text-caption" no-caps>
                            <!--Message change to-->
                            <q-item class="q-pa-sm cursor-pointer" v-close-popup
                                    @click.native="updateStatus({...props, col : col})">
                              <div class="row items-center">
                                <q-icon name="fas fa-pen" class="q-mr-sm"
                                        :color="!col.value ? 'green' : 'red'"/>
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
        <!--Loading-->
        <inner-loading :visible="loading"/>
      </div>
    </div>
    <!-- Export Component -->
    <master-export v-model="exportParams" ref="exportComponent" export-item/>
  </div>
</template>

<script>
//Components
import masterExport from "@imagina/qsite/_components/master/masterExport"

export default {
  beforeDestroy() {
    this.$root.$off('crud.data.refresh')
  },
  props: {
    params: {default: false},
    title: {default: false}
  },
  components: {masterExport},
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
        grid: this.params.read.showAs == 'grid'
      },
      statusModel: {},//Model to status
      itemIdToDelete: false,//ID of item to delete,
      filter: {
        available: false,
        show: false,
      },
      dataField: [],
      exportParams: false
    }
  },
  computed: {
    //Table actions
    tableActions() {
      //Default response
      let response = [{
        label: this.$tr(`ui.message.${this.table.grid ? 'listView' : 'gribView'}`),
        vIf: (this.params.read.allowToggleView != undefined) ? this.params.read.allowToggleView : true,
        props: {
          icon: !this.table.grid ? 'fas fa-grip-horizontal' : 'fas fa-list-ul'
        },
        action: () => this.table.grid = !this.table.grid
      }]

      //Add search action
      if (this.params.read.search !== false) response.push('search')

      //Add create action
      if (this.params.create && this.params.hasPermission.create) response.push('new')

      //Response
      return response
    },
    //Define slot table to show
    showSlotTable() {
      let data = this.$clone(this.table.data)
      let lengData = (data && data.length) ? data.length : false
      let pagination = this.$clone(this.table.pagination)

      //Order response
      let response = {
        header: this.params.read.hideHeader ? false : (lengData ? true : false),
        bottom: (pagination.rowsNumber >= pagination.rowsPerPage) ? true : (!lengData ? true : false)
      }

      return response //Response
    },
    //Options rows per page
    rowsPerPageOption() {
      return this.params.read.rowsPerPageOptions || [5, 10, 20, 50, 100, 300, 500]
    },
    //return table columns
    tableColumns() {
      let columns = this.$clone(this.params.read.columns)
      //Check columns
      columns.forEach(column => {
        //Default sort by id
        if (['id', 'created_at', 'updated_at'].indexOf(column.name) != -1) column.sortable = true
        //Validate column actions
        if (column.name == 'actions') column.align = 'right'
        //Add format to status column
        if ((['status', 'active'].indexOf(column.name) != -1) || column.asStatus) {
          column.format = val => {
            let value = (typeof val === "boolean") ? (val = val ? 1 : 0) : val//Convert booleand to integer
            return Number.isInteger(parseInt(value)) ? parseInt(value) : 0//Parse value
          }
        }
      })
      //Response
      return columns
    },
    //Grid params
    gridParams() {
      let gridParams = this.params.read.grid || {}//Get grid params
      //Response
      return {
        colClass: gridParams.colClass || 'col-12 col-sm-6 col-lg-4 col-xl-3',
        component: gridParams.component || false
      }
    }
  },
  methods: {
    //init form
    async init() {
      await this.orderFilters()//Order filters
      this.handlerUrlCrudAction()//Handler url action
      this.$root.$on('crud.data.refresh', () => this.getDataTable(true))//Listen refresh event
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
      //Success
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
      params.params.filter.order = {
        field: pagination.sortBy || 'id',
        way: (pagination.descending != undefined) ? (pagination.descending ? 'desc' : 'asc') : 'desc'
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

        //Dispatch event hook
        this.$hook.dispatchEvent('wasListed', {entityName: this.params.entityName})

        //Close loading
        this.loading = false
      }).catch(error => {
        this.$alert.error({message: this.$tr('ui.message.errorRequest'), pos: 'bottom'})
        console.error(error)
        this.loading = false
      })
    },
    //Delete category
    deleteItem(item) {
      this.$alert.error({
        mode: 'modal',
        title: `ID: ${item.id}`,
        message: this.$tr('ui.message.deleteRecord'),
        actions: [
          {label: this.$tr('ui.label.cancel'), color: 'grey'},
          {
            label: this.$tr('ui.label.delete'),
            color: 'red',
            handler: () => {
              this.loading = true
              let propParams = this.$clone(this.params)
              //If is crud field
              if (this.params.field) {
                let dataField = this.$clone(this.dataField)//get data table
                dataField.value.splice(item.__index, 1)//Remove field

                //Request
                this.$crud.update(propParams.apiRoute, dataField.id, dataField).then(response => {
                  this.$alert.info({message: this.$tr('ui.message.recordDeleted')})
                  this.getDataTable(true)
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

                  //Dispatch event hook
                  this.$hook.dispatchEvent('wasDeleted', {entityName: this.params.entityName})

                  //Close loading
                  this.loading = false
                }).catch(error => {
                  this.$alert.error({message: this.$tr('ui.message.recordNoDeleted'), pos: 'bottom'})
                  this.loading = false
                })
              }
            }
          }
        ]
      })
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
    },
    //Return field actions
    fieldActions(field) {
      let actions = this.$clone(this.params.read.actions || [])
      let response = []

      //Add default actions
      actions = [...actions,
        //Export
        {
          label: this.$tr('ui.label.export'),
          vIf: this.exportParams,
          icon: 'fas fa-file-download',
          action: (item) => this.$refs.exportComponent.showReportItem({
            item: item,
            exportParams: {fileName: `${this.exportParams.fileName}-${item.id}`},
            filter: {id: item.id}
          })
        },
        {//Edit action
          icon: 'fas fa-pen',
          color: 'green',
          label: this.$tr('ui.label.edit'),
          vIf: this.permitAction(field).edit,
          action: (item) => {
            this.$emit('update', item)
          }
        },
        {//Delete action
          icon: 'fas fa-trash-alt',
          color: 'red',
          label: this.$tr('ui.label.delete'),
          vIf: this.permitAction(field).destroy,
          action: (item) => {
            this.deleteItem(item)
          }
        }
      ]

      //Order field actions
      if (actions && actions.length) {
        actions.forEach(action => {
          if (action.format) action = {...action, ...action.format(field)}
          response.push(action)
        })
      }

      //response
      return response
    },
    //Hanlder method create
    handlerActionCreate() {
      //Redirect to vue route
      if (this.params.create.to) return this.$router.push(this.params.create.to)
      //Redirect esternal URL
      if (this.params.create.toExternalUrl) return this.$helper.openExternalURL(this.params.create.toExternalUrl, false)
      //Emit event create
      this.$emit('create')
    },
    //Handler url action
    handlerUrlCrudAction() {
      setTimeout(() => {
        let actions = this.$clone(this.params.read.actions || [])//Get read actions
        let urlQuery = this.$route.query//Get urlQuery

        //Validate if exist actions and url queries
        if (actions.length && Object.keys(urlQuery).length) {
          let actionValue = urlQuery[Object.keys(urlQuery)[0]]//Get first query parameter value from url
          let actionCrudData = actions.find(item => item.name == Object.keys(urlQuery)[0])//search action with name fro url query

          if (actionCrudData) {
            //Request Params
            let requestParams = {
              refresh: true,
              params: this.$clone(this.params.read.requestParams || {})
            }
            //Request and call action
            this.$crud.show(this.params.apiRoute, actionValue, requestParams).then(response => {
              actionCrudData.action(response.data)
            })
          }
        }
      }, 500)
    },
    //return item image
    itemImage(item) {
      //instance response
      let response = false

      //search mediumThumb
      if (item.mediaFiles && item.mediaFiles.mainimage)
        response = item.mediaFiles.mainimage.mediumThumb

      //response
      return response
    }
  }
}
</script>

<style lang="stylus">
#componentCrudIndex
  th
    color $blue-grey
    font-weight bold
    font-size 13px !important
    text-align left !important

  td
    color #222222

  .q-table__card
    background-color transparent !important
    box-shadow none !important

  .q-table__top, .q-table__middle, .q-table__bottom
    border-radius $custom-radius
    box-shadow $custom-box-shadow
    background-color white

  .q-table__top
    margin-bottom 16px !important
    padding 12px 16px !important

  .q-table__middle
    min-height 0 !important
    margin 0 !important

  .q-table__bottom
    margin-top 16px !important
    padding 12px 16px !important

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

  .default-card-grid
    .default-card-grid_item-image
      width 100%
      height 140px
      background-position center
      background-size cover
      background-repeat no-repeat
      border-radius $custom-radius-items
      margin 10px 0 10px 0

#dialogFilters
  min-height max-content !important
</style>
