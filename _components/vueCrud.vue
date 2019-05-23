<template>
	<q-page class="relative-position">
		<!--======================== FILTER AND LIST ======================-->
		<div id="vueCrud"
				 class="q-layout-page row layout-padding">
			<!--TITLE-->
			<h1 class="q-headline text-primary">
				<span>{{pluralName | capitalize}}</span>
			</h1>

			<div class="backend-page full-width">
				<div class="border-top-color row shadow-1" style="padding: 0px !important">
					<div class="col-12 filter">
						<crud-filter v-if="customFilter" :filterData="filterData" :parentId="parentId" :storeName="storeName" />
						<div v-else class="row items-center q-my-md ">
							<div v-for="(filter,index) in filterData" :key="index" :class="'full-width col-12 q-px-md col-md-'+filter.cols">
								<q-field class="inline-block">
									<q-search
										@keyup.enter="paginated.page = 1; getRecordsHelper();"
										v-if="index=='search'"
										v-model="filter.value"
										:placeholder="filter.placeHolder"
									/>

									<q-input
										@change="paginated.page = 1; getRecordsHelper();"
										:type="filter.type"
										v-if="filter.type!='select' && index!='search'"
										v-model="filter.value"
										:place-holder="filter.placeHolder"
										:stack-label="filter.label"
									/>

									<q-select
										@input="paginated.page = 1; getRecordsHelper();"
										v-if="filter.type=='select'"
										:multiple="filter.multiple ? filter.multiple : false"
										:chips="filter.chips ? filter.chips : false"
										:filter="filter.filter ? filter.filter : false"
										:radio="filter.radio ? filter.radio : false"
										v-model="filter.value"
										:placeholder="filter.placeHolder"
										:options="filter.options"
									/>
								</q-field>

                <!--Button new record-->
                <q-btn icon="fas fa-edit" color="positive" class="float-right"
											 :label="crudActions.actionsData.add.tooltip !='' ? crudActions.actionsData.add.tooltip : 'New ' + singularName | capitalize"
											 @click="addEditDialogOpen(false,'Create')"
											 v-if="!crudActions.permission || auth.hasAccess(crudActions.permission+'.create') && (crudActions.actionsData.add.permission ? auth.hasAccess(crudActions.actionsData.add.permission) : true)" />
							</div>
						</div>
					</div>
					<div class="col-12">
						<div v-if="records.length" class="table-responsive">
							<table class="q-table">
								<thead>
								<tr class="text-left">
									<th :key="header.value" v-for="header in headers">
										{{ header.text  }}
									</th>
									<th>Actions</th>
								</tr>
								</thead>
								<tbody>
								<tr v-for="(record,index) in records" :key="index">
									<td :key="header.value" v-for="header in headers">

										{{header.type == 'datetime' ? $d($moment(record[header.value], 'YYYY-MM-DD HH:mm').toDate(),'short',$q.i18n.lang) :
										header.type == 'status' ? record[header.value] == 1 || record[header.value] ? 'enabled': 'disabled' : record[header.value] }}
									</td>

									<td  class="text-center">

										<q-btn
											v-if="!crudActions.permission || auth.hasAccess(crudActions.permission+'.edit') && (crudActions.actionsData.edit.permission ? auth.hasAccess(crudActions.actionsData.edit.permission) : true)"
											class="q-mx-xs"
											:icon="crudActions.actionsData.edit.icon"
											color="positive"
											@click="addEditDialogOpen(record.id,'Edit')"
											size="sm"
										>
											<q-tooltip
												class="bg-positive"
												anchor="bottom middle"
												self="top middle"
												:offset="[10, 10]">
												{{crudActions.actionsData.edit.tooltip !='' ? crudActions.actionsData.edit.tooltip : 'Edit ' + singularName | capitalize}}
											</q-tooltip>
										</q-btn>

										<q-btn
											v-if="!crudActions.permission || auth.hasAccess(crudActions.permission+'.destroy') && (crudActions.actionsData.delete.permission ? auth.hasAccess(crudActions.actionsData.delete.permission) : true)"
											class="q-mx-xs"
											:icon="crudActions.actionsData.delete.icon"
											color="red"
											@click="addEditDialogDelete(record.id)"
											size="sm"
										>
											<q-tooltip
												class="bg-negative"
												anchor="bottom middle"
												self="top middle"
												:offset="[10, 10]">
												{{crudActions.actionsData.delete.tooltip !='' ? crudActions.actionsData.delete.tooltip : 'Delete ' + singularName | capitalize}}
											</q-tooltip>
										</q-btn>

									</td>
								</tr>
								</tbody>
							</table>
						</div>
						<div v-else
								 class="text-center"
								 style="margin-top: 60px">
							<p class="text-faded"
							>
								No <b>{{pluralName | capitalize}}</b> found...
							</p>
						</div>
						<q-pagination
							class="justify-center q-ma-lg"
							v-if="paginated.max > 1"
							v-model="paginated.page"
							color="primary"
							@input="getRecordsHelper()"
							:max="paginated.max"
							:max-pages="6"
							boundary-links
							direction-links
						/>
					</div>
				</div>
			</div>
		</div>


		<!--======================== MODAL EDIT ADD ======================-->
		<q-modal v-model="addEditDialogFlag" class="backend-page"
						 :content-css="{minWidth: '80vw', minHeight: '80vh'}">
			<q-modal-layout>
				<q-toolbar slot="header">
					<q-btn
						flat
						round
						dense
						v-close-overlay
						icon="keyboard_arrow_left"
					/>
					<q-toolbar-title>
						{{action}} {{singularName | capitalize}}

					</q-toolbar-title>
				</q-toolbar>

				<div class="layout-padding">

					<crud-form v-if="customForm" :record="record" :storeName="storeName"  @closeModal="closeAddEditDialog"
										 @getRecords="getRecordsHelper" @clearCache="clearCache"/>

					<div v-else class="row defaultForm">
						<div class="col-12 col-md-9 q-px-md">
							<div class="row">
								<div class="col-12 q-my-md"
										 v-for="(field,index) in fieldsData"
										 :key="index"
										 v-if="field.viewPosition ? field.viewPosition == 'left' ? true : false : true">


									<q-field
										:error="$v.record[field.name].$error"
										error-label="This field is required"
									>

										<q-input
											v-if="field.type!='select' && field.type!='treeselect'"
											:type="field.type"
											v-model="record[field.name]"
											:stack-label="field.label+':'"
											:value="record[field.name]"
										/>

										<q-select
											v-if="field.type=='select'"
											:multiple="field.multiple ? field.multiple : false"
											:chips="field.chips ? field.chips : false"
											:filter="field.filter ? field.filter : false"
											:radio="field.radio ? field.radio : false"
											v-model="record[field.name]"
											:options="field.options ? field.options : []"
										/>

										<treeselect
											v-if="field.type=='treeselect'"

											:multiple="field.multiple ? field.multiple : false"
											:options="field.options ? field.options : []"
											:value-consists-of="field.valueConsistsOf"
											v-model="record[field.name]"
											:placeholder="field.placeHolder"
										/>
									</q-field>
								</div>
							</div>
						</div>

						<div class="col-12 col-md-3 q-px-md">
							<div class="row">
								<div class="col-12 q-my-md"
										 v-for="(field,index) in fieldsData"
										 :key="index"
										 v-if="field.viewPosition ? field.viewPosition == 'right' ? true : false : true">


									<q-field
										:error="$v.record[field.name].$error"
										error-label="This field is required"
									>

										<q-input
											:type="field.type"
											v-if="field.type!='select' && field.type!='treeselect'"
											v-model="record[field.name]"
											:stack-label="field.label+':'"
											:value="record[field.name]"
										/>

										<q-select
											v-if="field.type=='select'"
											:multiple="field.multiple ? field.multiple : false"
											:chips="field.chips ? field.chips : false"
											:filter="field.filter ? field.filter : false"
											:radio="field.radio ? field.radio : false"
											v-model="record[field.name]"
											:stack-label="field.label+':'"
											:options="field.options ? field.options : []"
										/>

										<treeselect
											v-if="field.type=='treeselect'"

											:multiple="field.multiple ? field.multiple : false"
											:options="field.options ? field.options : []"
											:value-consists-of="field.valueConsistsOf"
											v-model="record[field.name]"
											:placeholder="field.placeHolder"
										/>
									</q-field>
								</div>
							</div>
						</div>

						<div class="row">
							<!--=== SAVE ===-->
							<div class="col-12 text-center q-my-md">
								<q-btn :loading="loading"
											 color="positive"
											 @click="addEditDialogSave">
									Save
								</q-btn>
							</div>
						</div>
					</div>
				</div>
			</q-modal-layout>
		</q-modal>

		<!--======================== PAGE STICKY BUTTONS ======================-->

		<!-- EXPORT BUTTON
		<q-page-sticky v-if="records.length" position="bottom-right" :offset="[18, 65]">


		</q-page-sticky>
		-->
		<!-- ADD BUTTON -->
		<q-page-sticky
			position="bottom-right"
			:offset="[18, 18]">

			<div class="column items-center">
				<q-btn
					fab-mini
					v-if="!crudActions.permission || auth.hasAccess(crudActions.permission+'.export') && (crudActions.actionsData.export.permission ? auth.hasAccess(crudActions.actionsData.export.permission) : true)"
					color="primary"
					:icon="crudActions.actionsData.export.icon ? crudActions.actionsData.export.icon : 'add'"
					class="animate-pop"
					@click="exportBtnClick">


					<q-tooltip
						class="bg-primary"
						anchor="center left"
						self="center right"
						:offset="[10, 10]">
						{{crudActions.actionsData.export.tooltip !='' ? crudActions.actionsData.export.tooltip : 'Export ' + singularName | capitalize}}
					</q-tooltip>
				</q-btn>
			</div>


		</q-page-sticky>

		<!--======================== LOADING ======================-->

		<!--Inner loading-->
		<inner-loading :visible="loading" />
	</q-page>
</template>

<script>
  /* Plugins */
  import _cloneDeep from 'lodash.clonedeep'
  import {alert} from '@imagina/qhelper/_plugins/alert'
	import crud from '../_store/index'
  import {helper} from '@imagina/qhelper/_plugins/helper'
  import store from 'src/store/index'
  /* Components */
  import Treeselect from '@riophae/vue-treeselect';
  import '@riophae/vue-treeselect/dist/vue-treeselect.css';
	import innerLoading from 'src/components/master/innerLoading'

  export default {
    props: {
      parentId: {type: String, default: null},
      storeName: {type: String, required: true},
      pluralName: {type: String, required: true},
      singularName: {type: String, required: true},
      crudActions: {type: Object, required: true},
      crudFields: {type: Object, required: true},
      crudFilter: {type: Object, required: true},
      crudTable: {type: Object, required: true},
      crudForm: {type: Object, required: true},
      crudOps: {type: Object, required: true},
      crudTitle: {type: String},
      doPage: {type: Boolean, default: true},

    },

    components: {
      Treeselect, innerLoading
    },

    created() {

     this.initialize();

    },
    async mounted () {
      for (var key in this.fieldsData) {
        if (this.fieldsData[key].optionsFn) this.fieldsData[key].options = await this.fieldsData[key].optionsFn()
      }
		},

    data() {
      return {
        // form
        addEditDialogFlag: false,
        validForm: true,
        // filter
        validFilter: true,
        // data-table
        loading: false,
        headers: {}, // pass in
        inline: false, // inline editing
        customFilter: false, // custom filter flags
        customForm: false, // custom form flags
        // snackbar
        snackbar: false,
        snackbarText: '',
        paginated: {
          page: 1,
          max: 1
        },
        action: 'Edit',
				auth: require('@imagina/quser/_plugins/auth').default

      }
    },

    validations() {
      return this.allRules();

    },

    computed: {
      showTitle() {
        return this.crudTitle || this.storeName
      },
      // ...mapGetters(storeModuleName, [ 'records', 'totalRecs', 'filterData', 'record' ]), // cannot use for multiple stores, try below
      records() {
        return this.$store.getters[this.storeName + '/records']
      },
      totalRecs() {
        return this.$store.getters[this.storeName + '/totalRecs']
      },
      filterData() {
        return this.$store.getters[this.storeName + '/filterData']
      },
      fieldsData() {
        return this.$store.getters[this.storeName + '/fieldsData']
      },
      pagination() {
        return this.$store.getters[this.storeName + '/pagination']
      }, // not used
      record() {
        return this.$store.getters[this.storeName + '/record']
      }
    },

    filters: {
      capitalize: function (value) {
        if (!value) return ''
        value = value.toString()
        return value.charAt(0).toUpperCase() + value.slice(1)
      },

      formatters:function (value) {
        return this.crudTable.formatters(value);

      }
    },

    watch: {
      loading: function (newValue, oldValue) {
      },
			'$route' (to, from) {
        this.initialize();
			}

    },

    methods: {
      initialize(){
        if (!this.$t || !this.$i18n) this.$t = null // if i18n is not found
        const store = this.$store
        const name = this.storeName
        if (!(store && store.state && store.state[name])) { // register a new module only if doesn't exist
          store.registerModule(name, _cloneDeep(crud)) // make sure its a deep clone
          store.state[name].defaultRec = this.crudForm.defaultRec
          store.state[name].filterData = this.crudFilter.filterData
          store.state[name].fieldsData = this.crudFields.fieldsData
          store.state[name].crudData = this.crudActions
          store.state[name].crudOps = this.crudOps
          store.state[name].configNames.storeName = this.storeName
          store.state[name].configNames.pluralName = this.pluralName
          store.state[name].configNames.singularName = this.singularName
        } else { // re-use the already existing module
        }
        this.$options.filters.formatters = this.crudTable.formatters // create the formatters programatically
        this.headers = this.crudTable.headers || {}
        this.$options.components['crud-filter'] = this.crudFilter.FilterVue
        this.$options.components['crud-form'] = this.crudForm.FormVue


        this.$options.components['crud-filter']().component ? this.customFilter = true : false;
        this.$options.components['crud-form']().component ? this.customForm = true : false;
        this.paginated = {
          page: 1,
            max: 1
        },
        this.getRecordsHelper();
			},
      allRules(){
        var rules = {};
				var fields = this.fieldsData;
        for (var key in fields) {
          rules[key] = fields[key].rules
        }
        return {record:rules};
			}
      ,
      async getRecords(payload) {
        await this.$store.dispatch(this.storeName + '/getRecords', payload)
      },
      setPagination(payload) {
        this.$store.dispatch(this.storeName + '/setPagination', payload)
      },
      async deleteRecord(payload) {
        this.loading = true
        await this.$store.dispatch(this.storeName + '/deleteRecord', payload)
        if(navigator.onLine)
        	await this.clearCache()
        this.loading = false
      },
      async updateRecord(payload) {
        this.loading = true
        await this.$store.dispatch(this.storeName + '/updateRecord', payload)

        this.loading = false
      },
      async createRecord(payload) {
        this.loading = true
        await this.$store.dispatch(this.storeName + '/createRecord', payload)
        this.loading = false
      },
      async getRecord(payload) {
        this.loading = true
        await this.$store.dispatch(this.storeName + '/getRecord', payload)
        this.loading = false
      },
      setRecord(payload) {
        this.$store.commit(this.storeName + '/setRecord', null)
      },
			async clearCache(){

        await helper.clearCache(this.storeName)
			},
      async exportRecords(payload) {
        await this.$store.dispatch(this.storeName + '/exportRecords', payload)
      },
      closeAddEditDialog() {
        this.addEditDialogFlag = false
      },
      async addEditDialogOpen(id, action) {
        if (id) await this.getRecord({id}) // edit
        else this.setRecord() // add
        this.action = action
				if(Object.keys(this.record).length)
        	this.addEditDialogFlag = true
      },
      async addEditDialogSave(e) {
        this.$v.$touch();//validate all fields from form

        if (this.$v.$error) {
          alert.error('Please review fields again.', 'bottom')
          return
        }

        if (this.record.id) await this.updateRecord({record: this.record})
        else await this.createRecord({record: this.record, parentId: this.parentId})
				if(navigator.onLine)
        	await this.clearCache()
        await this.getRecordsHelper()
        this.closeAddEditDialog()
      },
      async addEditDialogDelete(id) {
        this.loading = true;
        let actions = [
          {
            label: 'Delete', icon: '', handler: () => {
              this.delete(id)
            }
          },
          {
            label: 'Cancel', icon: '', handler: () => {
              this.loading = false;
              return false
            }
          }
        ];

				alert.warning("Are you sure to delete this " + this.singularName + "?", "center", actions)
      },
      async delete(id) {
        if (id) {
          await this.deleteRecord({id})
          if(navigator.onLine){
            await this.getRecordsHelper()
          }
        }
        this.closeAddEditDialog()
        this.loading = false;
      },

      async getRecordsHelper() {
        this.loading = true
        await this.getRecords({
          pagination: this.paginated,
          filterData: this.filterData,
          parentId: this.parentId
        })
				if(this.totalRecs) {
          this.paginated.max = this.pagination.page.lastPage
          this.paginated.page = this.pagination.page.currentPage
        }else{
          this.paginated.max = 1
          this.paginated.page = 1
				}
				this.loading = false
      },
      async submitFilter() {
        await this.getRecordsHelper()
      },
      async exportBtnClick() {
        this.loading = true
        await this.exportRecords({
          pagination: this.pagination,
          filterData: this.filterData,
          parentId: this.parentId,
          crudTable : this.crudTable
        })
        this.loading = false
      }
    }
  }
</script>

<style lang="stylus" scoped>
	#vueCrud{
		tr {
			border .1em solid #e5e5e5
		}
	}
	.make-modal {
		margin: 0;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 100;
		padding: 0;
		min-width: 100%;
		min-height: 100%;
		background-color: #fff;
	}
	.q-field-bottom{
		margin: -1px;
	}
</style>
