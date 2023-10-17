<template>
  <div id="crudContentPage">
    <!--=== Dynamic component to get crud data ===-->
    <component :is="componentCrudData" ref="componentCrudData" @hook:mounted="init"/>

    <!--=== Button to Create ===-->
    <q-btn class="btnJustCreate btn-small" v-bind="defaultProps" rounded unelevated
           @click="create()" v-if="showType('button-create')"/>

    <!--=== Select to List and Create ===-->
    <dynamic-field v-model="dataCrudSelect.itemSelected" :field="selectField" v-if="showType('select')"
                   @input="emitValue" @click.native="showEventListener">
      <!--Before options slot-->
      <div slot="before-options">
        <q-btn class="btnCreateCrud full-width" flat icon="fas fa-plus" color="green"
               :label="`${params.create.title || ''}`" v-if="params.create"/>
      </div>
    </dynamic-field>

    <!--=== Full Crud ===-->
    <div v-if="success">
      <!--Index component-->
      <crud-index v-if="showType('full')" :params="$clone(paramsProps)" ref="crudIndex"
                  @create="create" @update="update" :title="title"/>
      <!--Modal create/update component-->
      <crud-form v-model="showModal" v-show="(params.create || params.update) && showModal"
                 :params="paramsProps" :item-id="itemIdToEdit" :field="fieldData"
                 @created="(response) => formEmmit('created', response)"
                 @updated="formEmmit('updated')"/>
    </div>

    <!--=== Dialog permission deny ===-->
    <q-dialog v-model="dialogPermissions.show">
      <q-card>
        <q-card-section>
          <div class="text-h6 text-red">
            <q-icon name="fas fa-exclamation-triangle"/>
            {{ $tr('isite.cms.crud.message.denyPermissions') }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="OK" color="red" v-close-popup/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
//Component
import crudIndex from '@imagina/qcrud/_components/index'
import crudForm from '@imagina/qcrud/_components/form'

export default {
  beforeDestroy() {
    this.$root.$off(`${this.paramsProps.apiRoute}.crud.event.created`)
  },
  props: {
    crudData: {default: false},//import of vue with computed
    type: {default: 'full'},
    crudProps: {
      type: Object, default: () => {
        return {}
      }
    },
    config: {
      type: Object, default: () => {
        return {}
      }
    },
    value: {default: null},
    customData: {
      default: () => {
        return {}
      }
    },
    rules: {
      default: () => {
        return []
      }
    },
    title: {defualt: false}
  },
  // Dependency injection
  provide() {
    return {
      update: this.update,
    };
  },
  components: {crudIndex, crudForm},
  watch: {
    value(newValue, oldValue) {
      if (!newValue || (JSON.stringify(newValue) != JSON.stringify(oldValue))) {
        this.setValueSelect()
      }
    }
  },
  mounted() {
    this.$nextTick(async function () {
    })
  },
  data() {
    return {
      componentCrudData: () => this.crudData,//To get crud data from computed
      params: false,
      success: false,//Global status of component
      loading: true,//Loading
      dialogPermissions: {
        show: false
      },
      showModal: false,//vmodel modal
      fieldData: false,//Field data
      itemIdToEdit: false,//item ID to edit
      dataCrudSelect: {
        loading: false,
        itemSelected: null,//Item to emmit if is crudSelect
        options: [],//options to show in select
        rootOptions: [],//Save all options
      },
      dataFieldsCustom: {},
      itemCrudFields: false//Fields from item to replace form fields
    }
  },
  computed: {
    //Return has permission
    hasPermission() {
      let params = this.$clone(this.params)

      //Default permission
      let permissions = {
        create: params.permission ? this.$auth.hasAccess(`${params.permission}.create`) : true,
        index: params.permission ? this.$auth.hasAccess(`${params.permission}.index`) : true,
        edit: params.permission ? this.$auth.hasAccess(`${params.permission}.edit`) : true,
        destroy: params.permission ? this.$auth.hasAccess(`${params.permission}.destroy`) : true,
      }

      //Custom permissions
      if (params.customPermissions)
        for (var name in params.customPermissions)
          permissions[name] = this.$auth.hasAccess(params.customPermissions[name])

      //Repsonse
      return permissions
    },
    //Default props
    defaultProps() {
      let defaultProps = {label: (this.params ? this.params.create.title : '')}

      switch (this.type) {
        case 'select':
          defaultProps = {
            outlined: true,
            dense: true,
            emitValue: true,
            'use-input': true,
            'map-options': true,
            ...defaultProps,
          }
          break
        case 'button-create':
          defaultProps = {
            icon: 'fas fa-plus',
            color: 'green',
            size: 'sm',
            ...defaultProps,
          }
          break
      }

      return {...defaultProps, ...this.crudProps}
    },
    //Default configs
    defaultConfig() {
      let defaultConfig = {}

      switch (this.type) {
        case 'select':
          defaultConfig = {
            options: {label: 'title', value: 'id'},
            ...defaultConfig,
          }
          break
        case 'button-create':
          defaultConfig = {
            ...defaultConfig,
          }
          break
      }

      return {...defaultConfig, ...this.config}
    },
    //Return params Props
    paramsProps() {
      if (!this.$refs.componentCrudData) return {}
      let crudData = this.$clone(this.$refs.componentCrudData.crudData || {})//
      crudData.hasPermission = this.hasPermission//Add permission validated

      //Merge fields with dataFieldsCustom
      for (var fieldName in this.dataFieldsCustom) {
        if (crudData.formLeft && crudData.formLeft[fieldName])
          crudData.formLeft[fieldName].value = this.dataFieldsCustom[fieldName]
        if (crudData.formRight && crudData.formRight[fieldName])
          crudData.formRight[fieldName].value = this.dataFieldsCustom[fieldName]
      }

      //Merge with custom data
      if (this.customData && (typeof this.customData == 'object')) {
        for (var itemName in this.customData) {
          let itemValue = this.$clone(this.customData[itemName])
          crudData[itemName] = (typeof itemValue == 'object') ? {...crudData[itemName], ...itemValue} : itemValue
          if (itemName == 'getDataForm') crudData[itemName] = this.customData[itemName]
        }
      }

      //Replece to itemCrudFields
      if (this.itemCrudFields) {
        crudData.formLeft = this.$clone(this.itemCrudFields)
        crudData.formRight = {}
      }

      //Response
      return crudData
    },
    //Emit value
    emitValue() {
      this.$emit('input', this.dataCrudSelect.itemSelected)
    },
    //select field props
    selectField() {
      let params = this.$clone(this.paramsProps)
      //Instance the field config
      const fieldConfig = {
        value: null,
        type: this.defaultConfig.filterByQuery ? 'select' : 'treeSelect',
        props: {
          label: (this.params ? this.params.create.title : ''),
          options: this.defaultConfig.filterByQuery ? [] : this.$array.tree((this.dataCrudSelect.rootOptions || []), {
            label: 'label',
            id: 'value'
          }),
          clearable: false,
          appendToBody: true,
          sortValueBy: 'INDEX',
          searchNested: true,
          flat: this.crudProps.multiple ? true : false,
          loading: this.dataCrudSelect.loading,
          readonly: this.dataCrudSelect.loading,
          ...this.crudProps
        },
        loadOptions: !this.defaultConfig.filterByQuery ? false : {
          apiRoute: params.apiRoute,
          select: {
            ...this.defaultConfig.options,
            id: this.defaultConfig.options.value || 'id'
          },
          filterByQuery: true,
          requestParams: {
            ...(params.read.requestParams || {}),
            ...(this.defaultConfig.requestParams || {})
          }
        }
      }
      //Repsonse
      return fieldConfig
    }
  },
  methods: {
    showEventListener() {
      const el = document.querySelector(".btnCreateCrud");
      if (el) {
        el.addEventListener("click", this.showCreateModal);
      }
    },
    showCreateModal(e) {
      this.create();
      e.stopPropagation();
    },
    //init form
    async init() {
      if (this.$refs.componentCrudData && this.$refs.componentCrudData.crudData) {
        this.params = this.$clone(this.$refs.componentCrudData.crudData)//asing crudData to params
        //Set default value selected
        this.dataCrudSelect.itemSelected = (this.crudProps && this.crudProps.multiple) ? [] : null
        this.loading = false //hidden Loading
        this.success = true//udate success
        this.getIndexOptions()//Get indexOptions if is crudSelect
        //Listen event to created
        this.$root.$on(`${this.paramsProps.apiRoute}.crud.event.created`, this.getIndexOptions)
        //Set value select
        this.setValueSelect()
      }
    },
    //Return options if is crudSelect
    getIndexOptions() {
      if (this.type != 'select') return false

      if (this.defaultConfig.filterByQuery) {

      } else {
        this.dataCrudSelect.loading = true
        let params = this.$clone(this.paramsProps)
        let responseOptions = []//Default Value

        //Order params to request
        let requestParams = {
          refresh: true,
          params: params.read.requestParams || {}
        }

        //Merge woth request params if exist
        if (this.defaultConfig.requestParams) requestParams.params = {
          ...requestParams.params,
          ...this.defaultConfig.requestParams
        }

        //Request to get data
        this.$crud.index(params.apiRoute, requestParams).then(response => {

          //Set all items to response
          response.data.forEach(item => {
            responseOptions.push({
              ...item,
              label: item[this.defaultConfig.options.label],
              value: item[this.defaultConfig.options.value].toString()
            })
          })
          this.dataCrudSelect.loading = false
        }).catch(error => {
          this.$apiResponse.handleError(error, () => {
            this.dataCrudSelect.loading = false
          })
        })

        //Set options
        this.dataCrudSelect.rootOptions = responseOptions
        this.dataCrudSelect.options = responseOptions
      }
    },
    //Filter options when is crudSelect
    filterOptions(val, update) {
      update(() => {
        this.dataCrudSelect.options = this.$helper.filterOptions(
            val,
            this.dataCrudSelect.rootOptions,
            this.dataCrudSelect.itemSelected
        )
      })
    },
    //watch emit create from index component
    create(dataCustom = {}) {
      if (this.hasPermission.create) {
        this.dataFieldsCustom = dataCustom
        this.itemIdToEdit = false
        this.fieldData = false
        this.itemCrudFields = false
        if (this.paramsProps.create.to) this.$router.push(this.paramsProps.create.to)
        else this.showModal = true
      } else this.dialogPermissions.show = true
    },
    //watch emit update from index component
    update(item) {
      //Validate if can update
      if (this.hasPermission.edit) {
        let params = this.paramsProps
        //Set custom item crud fields
        if (item.crudFields) this.itemCrudFields = this.$clone(item.crudFields)
        //Set data to update
        if (item.id.field) this.fieldData = item.id.field
        //Go to edit
        if (params.update.to) this.$router.push({name: params.update.to, params: item})
        //Edit by method
        else if (params.update.method) params.update.method(item)
        else {
          this.itemIdToEdit = item.id
          this.showModal = true
        }
      } else this.dialogPermissions.show = true
    },
    //Delete category
    delete(item) {
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
              //Request
              this.$crud.delete(this.params.apiRoute, item.id).then(response => {
                //Alert
                this.$alert.info({message: this.$tr('isite.cms.message.recordDeleted')})
                //Dispatch event hook
                this.$hook.dispatchEvent('wasDeleted', {entityName: this.params.entityName})
                //Event
                this.$emit('deleted')
              }).catch(error => {
                this.$alert.error({message: this.$tr('isite.cms.message.recordNoDeleted'), pos: 'bottom'})
                this.loading = false
              })
            }
          }
        ]
      })
    },
    //watch emit update from form component
    formEmmit(type = 'created', response = false) {
      if (this.type == 'full') {
        this.$refs.crudIndex.getDataTable(true)
      } else this.getIndexOptions()
      this.$emit(type, response)
    },
    //Validate type to show
    showType(type) {
      if (!this.success) return false
      let response = true

      switch (type) {
        case 'full':
          if (!this.hasPermission.index) response = false
          if (this.type != 'full') response = false
          break;
        case 'select':
          if (!this.hasPermission.index) response = false
          if (this.type != 'select') response = false
          break;
        case 'button-create':
          if (!this.hasPermission.create) response = false
          if (this.type != 'button-create') response = false
          break;
      }

      return response
    },
    //Set value to select
    setValueSelect() {
      let newValue = this.$clone(this.value)
      if (Array.isArray(newValue)) {
        let responseSelected = []
        newValue.forEach(item => responseSelected.push(item.toString()))
        this.dataCrudSelect.itemSelected = this.$clone(responseSelected)
      } else if (typeof newValue == 'object')
        this.dataCrudSelect.itemSelected = newValue ? newValue : newValue
      else
        this.dataCrudSelect.itemSelected = newValue ? newValue.toString() : newValue
    }
  }
}
</script>
<style lang="stylus">
#crudContentPage
  .btnCreate
    padding 3px 8px

    .q-icon
      margin-right 5px
      font-size 12px

    .q-btn__content
      font-size 12px

.btnCreateCrud
  .q-icon
    margin-right 5px
    font-size 12px

  .q-btn__content
    font-size 12px
</style>
