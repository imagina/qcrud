<template>
  <div id="componentCrudIndex">
    <!--Content-->
    <div :id="appConfig.mode === 'ipanel' ? 'backend-page' : ''" class="backend-page">
      <!--Page Actions-->
      <div class="q-my-md">
        <page-actions
            :extra-actions="tableActions"
            :excludeActions="params.read.noFilter ? ['filter'] : []"
            :searchAction="params.read.searchAction"
            :title="tableTitle" @search="val => {table.filter.search = val; getDataTable()}"
            @new="handlerActionCreate()"
        />
      </div>
      <!-- Bulk Actions -->
      <div v-if="selectedRows.length" id="selectedRows"
           class="bg-primary text-white row justify-between items-center q-px-md q-mb-md q-py-sm">
        <!-- Label -->
        <div class="col-12 col-md-4">
          <b>{{ $tr('isite.cms.selectedRows', {num: selectedRows.length}) }}</b>
        </div>
        <!--Actions-->
        <div class="col-12 col-md-8">
          <div class="row q-gutter-sm justify-end">
            <q-btn v-for="(act, keyAct) in bulkActions" :key="keyAct" v-bind="act.props"
                   @click="handlerBulkAction(act)"/>
          </div>
        </div>
      </div>
      <div class="relative-position col-12" v-if="success">
        <folders v-if="localShowAs === 'folders'" />
        <!-- Drag View-->
        <div v-if="localShowAs === 'drag'" class="q-pt-sm q-pr-sm q-pl-md">
          <recursiveItemDraggable :items="dataTableDraggable"/>
        </div>
        <!--Table/Grid View-->
        <q-table
            v-model:pagination="table.pagination"
            v-if="['table','grid','folders'].includes(localShowAs)"
            :grid="localShowAs === 'grid'" :data="table.data"
            :columns="tableColumns"
            :pagination.sync="table.pagination"
            @request="getData"
            class="stick-table"
            :table-class="localShowAs === 'folders' ? 'tw-hidden' : ''"
            ref="tableComponent"
            card-container-class="q-col-gutter-md"
        >
          <!--Custom Columns-->
          <template v-slot:header="props">
            <q-tr :props="props">
              <q-th
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                <div v-if="col.name === 'selectColumn'">
                  <q-checkbox 
                    v-model="selectedRowsAll"
                    @input="selectAllFields"
                  />
                </div>
                {{ col.label }}
              </q-th>
            </q-tr>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td
                  v-for="(col, keyCol) in props.cols"
                  :key="col.name"
                  :props="props"
              >
                <!-- Select row -->
                <div v-if="col.name === 'selectColumn'">
                  <q-checkbox v-model="selectedRows" 
                    :val="props.key"
                  />
                </div>
                <!-- Button table collapsable -->
                <div v-if="col.name === 'expandibleColumn'">
                  <q-btn
                      size="sm"
                      flat
                      round
                      color="blue-grey"
                      :icon="tableCollapseIcon(props.key)"
                      @click="toggleRelationContent(props)"

                  />
                </div>
                <!--Actions column-->
                <div v-if="col.name == 'actions'">
                  <btn-menu
                      :actions="fieldActions(col)"
                      :action-data="props.row"
                  />
                </div>
                <!-- status columns -->
                <div v-else-if="(['status','active'].indexOf(col.name) != -1) || col.asStatus"
                     class="text-left">
                  <!--Action-->
                  <q-btn-dropdown
                      :color="col.value ? 'green' : 'red'"
                      flat
                      padding="sm none"
                      class="text-caption"
                      :label="col.value ? $tr('isite.cms.label.enabled') : $tr('isite.cms.label.disabled')"
                      no-caps
                      v-if="permitAction(props.row).edit"
                  >
                    <!--Message change to-->
                    <q-item class="q-pa-sm cursor-pointer" @click.native="updateStatus({...props, col})" v-close-popup>
                      <div class="row items-center">
                        <q-icon name="fas fa-pen" class="q-mr-sm" :color="!col.value ? 'green' : 'red'"/>
                        {{
                          $tr('isite.cms.message.changeTo', {text: (col.value ? $tr('isite.cms.label.disabled') : $tr('isite.cms.label.enabled'))})
                        }}
                      </div>
                    </q-item>
                  </q-btn-dropdown>
                  <!--Label-->
                  <label v-else>
                    {{ col.value ? $tr('isite.cms.label.disabled') : $tr('isite.cms.label.enabled') }}
                  </label>
                </div>
                <!--Default columns-->
                <div v-else>
                  <div @click="rowclick(col,props.row)" :class="isActionableColumn(col) ? 'cursor-pointer': ''">
                    {{ col.value }}
                  </div>
                </div>
              </q-td>
            </q-tr>
            <!-- Collapsed table relationship -->
            <q-tr style="border: 0">
              <q-td colspan="100%" id="collapseTable" style="height: 0; border: 0">
                <q-expansion-item :ref="`trExpansion${props.key}`" header-style="display : none" group="trExpansion">
                  <div id="contentRelationData" class="row items-center justify-center">
                    <!-- Data -->
                    <div v-if="relation.data.length" class="col-12 q-mb-md shadow-3">
                      <!--Label-->
                      <div v-if="relationConfig('label')"
                           class="q-py-sm q-px-sm text-blue-grey text-h4 text-weight-bold text-subtitle1 ellipsis title-content text-center">
                        {{ relationConfig('label') }}
                      </div>
                      <!-- Table -->
                      <q-table 
                        :data="relation.data"
                        :columns="relationConfig('columns')"
                      >
                        <template v-slot:body-cell="props">
                          <q-td :props="props">
                            <!--Actions-->
                            <btn-menu v-if="props.col.name == 'actions'"
                                      :actions="relationConfig('actions')"
                                      :action-data="props.row"
                            />
                            <!-- Default Value -->
                            <label v-else>{{ props.value }}</label>
                          </q-td>
                        </template>
                      </q-table>
                    </div>
                    <!-- Empty result -->
                    <not-result v-else/>
                    <!-- Inner loading -->
                    <inner-loading :visible="relation.loading"/>
                  </div>
                </q-expansion-item>
              </q-td>
            </q-tr>
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
              <q-card v-else class="box default-card-grid" style="padding-top: 5px">
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
                                          :label="col.value ? $tr('isite.cms.label.enabled') : $tr('isite.cms.label.disabled')"
                                          class="text-caption" no-caps>
                            <!--Message change to-->
                            <q-item class="q-pa-sm cursor-pointer" v-close-popup
                                    @click.native="updateStatus({...props, col : col})">
                              <div class="row items-center">
                                <q-icon name="fas fa-pen" class="q-mr-sm"
                                        :color="!col.value ? 'green' : 'red'"/>
                                {{
                                  $tr('isite.cms.message.changeTo', {text: (col.value ? $tr('isite.cms.label.disabled') : $tr('isite.cms.label.enabled'))})
                                }}
                              </div>
                            </q-item>
                          </q-btn-dropdown>
                        </div>
                        <!--Default columns-->
                        <div v-else> {{ col.value || '-' }}</div>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </div>
          </template>
          <!-- pagination -->
          <template #bottom="props">
            <div
                :class="`bottonCrud full-width flex items-center ${windowSize == 'mobile' ? 'justify-center' : 'justify-between'}`">
              <div :class="`text-blue-grey ${windowSize == 'mobile' ? 'q-mb-sm' : ''} `">
                {{ $tr('isite.cms.label.showing') }} {{ countPage(props) }} {{ $trp('isite.cms.label.entry') }}
              </div>
              <div class="col-12 q-ml-sm q-mr-lg flex flex-center">
                <q-pagination
                    id="crudPaginationComponent"
                    v-if="showPagination(props)"
                    v-model="table.pagination.page"
                    :value="props.pagination"
                    @click.prevent="getDataTable()"
                    round
                    color="blue-grey"
                    :max="props.pagesNumber"
                    :max-pages="6"
                    :ellipses="false"
                    :boundary-numbers="false"
                    unelevated
                />
              </div>
              <div class="flex items-center">
                <div class="flex items-center">
                  <div>{{ $tr('isite.cms.label.show') }}</div>
                  <q-select
                      v-model="table.pagination.rowsPerPage"
                      :options="rowsPerPageOption"
                      @input="getDataTable()"
                      options-cover
                      dense
                      class="q-mx-sm text-caption"
                      outlined
                  />
                  <div>{{ $trp('isite.cms.label.entry') }}</div>
                </div>
                <div class="actionsBtnPag">
                  <q-btn
                      icon="chevron_left"
                      color="primary"
                      round
                      dense
                      flat
                      :disable="props.isFirstPage"
                      @click="props.prevPage"
                  />
                  <q-btn
                      icon="chevron_right"
                      color="primary"
                      round
                      dense
                      flat
                      :disable="props.isLastPage"
                      @click="props.nextPage"
                  />
                </div>
              </div>
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
import recursiveItemDraggable from '@imagina/qsite/_components/master/recursiveItemDraggable';
import foldersStore from '@imagina/qsite/_components/master/folders/store/foldersStore.js'

export default {
  beforeDestroy() {
    this.$root.$off('crud.data.refresh')
  },
  props: {
    params: {default: false},
    title: {default: false}
  },
  components: {
    masterExport,
    recursiveItemDraggable
  },
  provide() {
    return {
      getRelationData: this.getRelationData,
    }
  },
  watch: {},
  mounted() {
    this.$nextTick(function () {
      this.init()
    })
  },
  data() {
    return {
      tableKey: null, // TableKey
      success: false,//Global status of component
      loading: true,//Loading
      windowWith: window.innerWidth, //windows size
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
      appConfig: config('app'),
      statusModel: {},//Model to status
      itemIdToDelete: false,//ID of item to delete,
      filter: {
        available: false,
        show: false,
      },
      dataField: [],
      exportParams: false,
      dataDraggable: [],
      localShowAs: 'table',
      relation: {
        loading: false,
        data: []
      },
      selectedRows: [],
      selectedRowsAll: false,
    }
  },
  computed: {
    //Table Title
    permisionRelation() {
      return this.params.read.relation.permission ? this.$auth.hasAccess(this.params.read.relation.permission) : true;
    },
    tableTitle() {
      const useLegacyStructure = parseInt(this.$store.getters['qsiteApp/getSettingValueByName']('isite::legacyStructureCMS') || 0)
      if (this.title)
        return useLegacyStructure ? this.$tr(this.title) : this.title
      if (this.params.read.title)
        return useLegacyStructure ? this.$tr(this.params.read.title) : params.read.title
      return ""
    },
    //Table actions
    tableActions() {
      //Default response
      let response = [{
        label: this.$tr(`isite.cms.message.${this.table.grid ? 'listView' : 'gribView'}`),
        vIf: (this.params.read.allowToggleView != undefined) ? this.params.read.allowToggleView : true,
        props: {
          icon: !this.table.grid ? 'fas fa-grip-horizontal' : 'fas fa-list-ul'
        },
        vIfAction: this.readShowAs === 'drag',
        action: () => this.localShowAs = this.localShowAs === 'grid' ? 'table' : 'grid',
      }]
      //Add search action
      if (this.params.read.search !== false) response.push('search')

      //Add create action
      if (this.params.create && this.params.hasPermission.create) response.push('new')

      //Response
      return response.filter((item) => !item.vIfAction)
    },
    //Define slot table to show
    showSlotTable() {
      let data = this.$clone(this.table.data)
      let lengData = (data && data.length) ? data.length : false
      let pagination = this.$clone(this.table.pagination)

      //Order response
      let response = {
        header: this.params.read.hideHeader ? false : true,
        bottom: (pagination.rowsNumber >= pagination.rowsPerPage) ? true : (!lengData ? true : false)
      }

      return response //Response
    },
    //Options rows per page
    rowsPerPageOption() {
      return this.params.read.rowsPerPageOptions || [5, 10, 20, 50, 100, 300, 500]
    },
    // collapsible relation return type
    relationConfig() {
      return (key = false) => {
        //Instance de relationConfig
        const relation = {
          label: '',
          apiRoute: '',
          requestParams: {},
          columns: [],
          actions: [],
          ...(this.params.read.relation || {})
        };
        //Default response
        if (!key) return relation
        //Add action column
        if (relation.actions.length && !relation.columns.find(item => item.name == 'actions')) {
          relation.columns.push({name: 'actions', label: this.$tr('isite.cms.form.actions'), align: 'center'},)
        }
        //Response
        return relation[key];
      };
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
      //Force align first column
      columns[0].align = 'left'
      // Collapsible action column
      const relationName = this.relationConfig('name');
      if ((this.relationConfig('name') || this.relationConfig('apiRoute')) && this.permisionRelation) {
        columns.unshift({
          name: 'expandibleColumn',
          label: '',
          align: 'center',
        })
      }
      //Select column
      if (this.bulkActions.length) {
        columns.unshift({name: 'selectColumn', label: '', align: 'center'})
      }
      //Response
      return columns
    },
    //windows size
    windowSize() {
      return this.windowWith >= '500' ? 'desktop' : 'mobile'
    },
    //Grid params
    gridParams() {
      let gridParams = this.params.read.grid || {}//Get grid params
      //Response
      return {
        colClass: gridParams.colClass || 'col-12 col-sm-6 col-lg-4 col-xl-3',
        component: gridParams.component || false
      }
    },
    //Validate read show as
    readShowAs() {
      return this.params.read.showAs || "table"
    },
    //Get Config data to table dragable
    getDataTableDraggable() {
      return this.table.data.map((item) => {
        const drag = this.params.read.drag || {};
        const title = item[drag.title?.field || 'id'];
        const subTitle = item[drag.subTitle?.field || ''];
        return {
          id: item.id,
          title: drag.title?.format(title) || title,
          subTitle: drag.subTitle?.format(subTitle) || subTitle,
          children: [],
          actions: this.fieldActions(item),
        }
      });
    },
    //data to table dragablle
    dataTableDraggable: {
      get: function () {
        return this.dataDraggable;
      },
      set: function (value) {
        this.dataDraggable = value;
      }
    },
    // validation to hide and show table collapse
    showCollapsedTable() {
      return key => key === this.tableKey;
    },
    // collapse return icon
    tableCollapseIcon(key) {
      return key => this.showCollapsedTable(key) ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    },
    //Return the bulk actions
    bulkActions() {
      var response = []
      var bulkActions = this.params.read.bulkActions || []
      //Validate availability
      response = bulkActions.filter(action => {
        //Validate vIf
        if ((action.vIf != undefined) && !action.vIf) return false
        //Validate permission
        if ((action.permission != undefined) && !this.$auth.hasAccess(action.permission)) return false
        //Validate apiRoute
        if (!action.apiRoute) return false
        //Default response
        return true
      }).map(action => {
        return {
          ...action,
          props: {
            rounded: true,
            dense: true,
            unelevated: true,
            color: "white",
            class: 'btn-small',
            noCaps: true,
            textColor: "blue-grey",
            padding: '3px 10px',
            ...(action.props || {})
          }
        }
      })
      //Response
      return response
    }
  },
  methods: {
    countPage(props) {
      const page = props.pagination.page
      const rowsPerPage = props.pagination.rowsPerPage
      const showTable = this.table.data.length
      const totalPage = props.pagination.rowsNumber
      const start = page == 1 ? 1 : page * rowsPerPage - ((rowsPerPage - (page - 1)) <= 0 ? 1 : rowsPerPage - (page - 1))
      const end = showTable < rowsPerPage ? totalPage : page * showTable
      return `${start} - ${end} ${this.$tr('isite.cms.label.of')} ${totalPage}`
    },
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
          callBack: () => this.handlerActionCreate()
        })
      }
      //Success
      this.success = true
    },
    //Order filters
    orderFilters() {
      return new Promise(async (resolve, reject) => {
        let params = this.$clone(this.params)
        if (this.params.read.noFilter) return resolve(true)
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
    //showPagination
    showPagination(props) {
      return this.windowSize == 'desktop' && props.pagesNumber > 1
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
    //Row click
    async rowclick(col,row){
      // if is an actionable column
      if(this.isActionableColumn(col)){
        //if the col has an action callback
        if(col.action){
          await col.action(row)
        } else{
          //finding the default action
          let defaultAction = this.fieldActions(col).find(action => {
            return action.default ?? false
          })

          if (defaultAction.action) await defaultAction.action(row)
        }
      }
    },
    //Get products
    getData({pagination, filter}, refresh = false) {
      let propParams = this.$clone(this.params)
      this.loading = true

      //Reset selected Rows
      this.selectedRows = [];
      this.selectedRowsAll = false;

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
      params.params.page = pagination.page;
      params.params.take = this.readShowAs !== 'drag' ? pagination.rowsPerPage : 9999;
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
        this.table.data = this.$clone(dataTable);
        const folderList = foldersStore().transformDataToDragableForderList(dataTable);
        foldersStore().setFolderList(folderList);
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
        //Sync data to drag view
        this.dataTableDraggable = this.getDataTableDraggable;
        this.localShowAs = this.readShowAs;
        //Close loading
        this.loading = false
      }).catch(error => {
        this.$alert.error({message: this.$tr('isite.cms.message.errorRequest'), pos: 'bottom'})
        console.error(error)
        this.loading = false
      })
    },
    //Delete category
    deleteItem(item) {
      this.$alert.error({
        mode: 'modal',
        title: `ID: ${item.id}`,
        message: this.$tr('isite.cms.message.deleteRecord'),
        actions: [
          {label: this.$tr('isite.cms.label.cancel'), color: 'grey'},
          {
            label: this.$tr('isite.cms.label.delete'),
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
                  this.$alert.info({message: this.$tr('isite.cms.message.recordDeleted')})
                  this.getDataTable(true)
                  this.loading = false
                }).catch(error => {
                  this.$alert.error({message: this.$tr('isite.cms.message.recordNoDeleted'), pos: 'bottom'})
                  this.loading = false
                })
              } else {
                //Request
                this.$crud.delete(propParams.apiRoute, item.id).then(response => {
                  this.$alert.info({message: this.$tr('isite.cms.message.recordDeleted')})
                  this.getDataTable(true)

                  //Dispatch event hook
                  this.$hook.dispatchEvent('wasDeleted', {entityName: this.params.entityName})

                  //Close loading
                  this.loading = false
                }).catch(error => {
                  this.$alert.error({message: this.$tr('isite.cms.message.recordNoDeleted'), pos: 'bottom'})
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
        this.$alert.info({message: this.$tr('isite.cms.message.recordUpdated')})
      }).catch(error => {
        this.loading = false
        this.$alert.error({message: this.$tr('isite.cms.message.recordNoUpdated')})
      })
    },
    //Return field actions
    fieldActions(field) {
      let actions = this.$clone(this.params.read.actions || [])
      let response = []

      //
      let defaultAction = actions.find(action => {
        return action.default ?? false;
      })

      //Add default actions
      actions = [...actions,
        //Export
        {
          label: this.$tr('isite.cms.label.export'),
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
          default: defaultAction ? false: true,
          label: this.$tr('isite.cms.label.edit'),
          vIf: this.permitAction(field).edit,
          action: (item) => {
            this.$emit('update', item)
          }
        },
        {//Copy disclosure link action
          label: this.$tr('isite.cms.label.copyDisclosureLink'),
          format: (item) => {
            return { vIf: item.url ? true : false }
          },
          icon: "fas fa-copy",
          action: (item) => this.$helper.copyToClipboard(item.url,'isite.cms.messages.copyDisclosureLink'),
        },
        {//Delete action
          icon: 'fas fa-trash-alt',
          color: 'red',
          label: this.$tr('isite.cms.label.delete'),
          vIf: this.permitAction(field).destroy,
          action: (item) => {
            this.deleteItem(item)
          }
        }
      ]

      //Order field actions
      if (actions && actions.length) {
        actions.forEach(action => {
          //if (action.format) action = {...action, ...action.format(field)}
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
      //Call a method to dispatch this action
      if (this.params.create.method) return this.params.create.method()
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
    },
    //Toggle relation data
    toggleRelationContent(props) {
      //Toggle section
      this.$refs[`trExpansion${props.key}`].toggle()
      //Actions when open a section
      if (!this.showCollapsedTable(props.key)) {
        this.tableKey = props.key
        this.getRelationData(props.row)
      } else {
        this.tableKey = null
      }
    },
    //Request the relation data
    getRelationData(row) {
      //Reset de realtion data
      this.relation.data = []

      if (this.relationConfig('apiRoute')) {
        this.relation.loading = true
        foldersStore().setRelationLoading(row.id, true);
        //Request Params
        const requestParams = {
          refresh: true,
          params: this.relationConfig().requestParams ? this.relationConfig().requestParams(row) : {}
        }
        //Request
        this.$crud.index(this.relationConfig('apiRoute'), requestParams).then(response => {
          this.relation.data = this.$clone(response.data)
          foldersStore().getListOfDragableRelations(row.id, response.data);
          this.relation.loading = false
          foldersStore().setRelationLoading(row.id, false);
        }).catch(error => {
          this.relation.loading = false
          foldersStore().setRelationLoading(row.id, false);
        })
      } else {
        this.relation.data = row[this.relationConfig('name')] || [];
      }
    },
    //handler bulk action
    handlerBulkAction(act) {
      this.loading = true
      //Instance the criteria
      const criteria = act.criteria || 'id'
      //Get selected data by criteria
      const selectedDataByCriteria = this.table.data.filter((item, keyItem) => {
        if (this.selectedRows.includes(item.id)) return true
        else return false
      }).map(item => item[criteria])
      //Instance request params
      var requestParams = {
        attributes: {
          field: this.$helper.convertStringToSnakeCase(criteria),
          [this.$helper.convertStringToSnakeCase(criteria)]: selectedDataByCriteria
        }
      }
      //Request
      this.$crud.post(act.apiRoute, requestParams).then(response => {
        this.getDataTable(true)
      }).catch(error => this.loading = false)
    },
    //Table default column actionable
    isActionableColumn(col){

      //if the columns has an action callback
      if(col.action) return true;

      //default columns
      return ['title','name','id'].includes(col.name)
    },
    selectAllFields() {
      if(this.selectedRowsAll) {
        const ids = this.table.data.map((item, index) => item.id);
        this.selectedRows = ids;
        return;
      }
      this.selectedRows = [];
    },
  }
}
</script>

<style lang="stylus">
#componentCrudIndex
  #backend-page
    .q-table__top, .q-table__middle, .q-table__bottom
      border-radius $custom-radius
      //box-shadow $custom-box-shadow
      background-color white

  th
    color $blue-grey
    font-weight bold
    font-size 13px !important

  //text-align left !important

  td
    color #222222

  .q-table__card
    background-color transparent !important
    box-shadow none !important

  .q-table__middle
    border-radius $custom-radius
    box-shadow $custom-box-shadow
    background-color white

  .q-table__top
    margin-bottom 16px !important
    padding 12px 16px !important
    back(true)

  .q-table__middle
    min-height 0 !important
    margin 0 !important

  .q-table__bottom
    border-top 1px solid transparent !important
    margin-top 16px !important
    padding 12px 16px !important
    back(true)

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

  #crudPaginationComponent
    .q-btn
      height 30px
      width 30px
      min-width 30px !important

  #collapseTable
    padding 0;
    background-color: $grey-1

    #contentRelationData
      min-height 90px
      position relative
      width 100%

    .q-table, th:last-child, th:first-child, td:last-child, td:first-child
      background-color: $grey-1

    .q-table__middle
      padding 0;
      box-shadow none;
      border-radius: 0;

  #selectedRows
    border-radius $custom-radius

#dialogFilters
  min-height max-content !important
</style>
