<template>
  <div id="crudContentPage">
    <!--=== Dynamic component to get crud data ===-->
    <component :is="componentCrudData" ref="componentCrudData" />

    <!--=== Button to Create ===-->
    <q-btn class="btnJustCreate btn-small" v-bind="defaultProps" rounded unelevated
           @click="create()" v-if="showType('button-create')" />
    <!--=== Select to List and Create ===-->
    <dynamic-field v-model="itemSelected" :field="selectField" :key="selectFieldKey" v-if="showType('select')"
                   @update:modelValue="emitValue" @click.native="showEventListener">
      <!--Before options slot-->
      <template v-slot:before-options>
        <div>
          <q-btn class="btnCreateCrud full-width" flat icon="fas fa-plus" color="green" no-caps
                 :label="`${paramsProps.create.title || ''}`" v-if="params.create" />
        </div>
      </template>
    </dynamic-field>

    <!--=== Full Crud ===-->
    <div v-if="success">
      <!--Index component-->
      <crud-index v-if="showType('full')" :params="$clone(paramsProps)" ref="crudIndex"
                  @create="create" @update="update" @deleted="formEmmit('deleted')" :title="title" />
      <!--Modal create/update component-->
      <crud-form v-model="showModal" v-show="(params.create || params.update) && showModal"
                 :params="paramsProps" :item-id="itemIdToEdit" :field="fieldData"
                 @update:modelValue="val => showModal = val"
                 @created="(response) => formEmmit('created', response)"
                 @updated="formEmmit('updated')"
                 @createdData="(response) => formEmmit('createdData', response)"
      />
    </div>

    <!--=== Dialog permission deny ===-->
    <q-dialog v-model="dialogPermissions.show">
      <q-card>
        <q-card-section>
          <div class="text-h6 text-red">
            <q-icon name="fas fa-exclamation-triangle" />
            {{ $tr('isite.cms.crud.message.denyPermissions') }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="OK" color="red" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
//Component
import crudIndex from 'modules/qcrud/_components/index';
import crudForm from 'modules/qcrud/_components/form';
import { eventBus } from 'src/plugins/utils';
import { markRaw } from 'vue';

export default {
  beforeUnmount() {
    eventBus.off(`${this.paramsProps.apiRoute}.crud.event.created`);
  },
  props: {
    crudData: { default: false },//import of vue with computed
    type: { default: 'full' },
    imageField: { default: false },
    crudProps: {
      type: Object, default: () => {
        return {};
      }
    },
    config: {
      type: Object, default: () => {
        return {};
      }
    },
    modelValue: { default: null },
    customData: {
      default: () => {
        return {};
      }
    },
    rules: {
      default: () => {
        return [];
      }
    },
    title: { defualt: false }
  },
  emits: ['update:modelValue', 'deleted', 'created', 'updated', 'createdData'],
  // Dependency injection
  provide() {
    return {
      update: this.update
    };
  },
  components: { crudIndex, crudForm },
  watch: {
    modelValue(newValue, oldValue) {
      if (!newValue || (JSON.stringify(newValue) != JSON.stringify(oldValue))) {
        this.setValueSelect();
      }
    }
  },
  beforeMount() {
    this.init();
  },
  data() {
    return {
      componentCrudData: null,
      params: false,
      success: false,//Global status of component
      loading: true,//Loading
      dialogPermissions: {
        show: false
      },
      selectField: null,
      showModal: false,//vmodel modal
      fieldData: false,//Field data
      itemIdToEdit: false,//item ID to edit
      itemSelected: this.crudProps?.multiple ? [] : null,
      dataFieldsCustom: {},
      itemCrudFields: false,//Fields from item to replace form fields
      selectFieldKey: this.$uid()
    };
  },
  computed: {
    //Return has permission
    hasPermission() {
      let params = this.$clone(this.params);

      //Default permission
      let permissions = {
        create: params.permission ? this.$hasAccess(`${params.permission}.create`) : true,
        index: params.permission ? this.$hasAccess(`${params.permission}.index`) : true,
        edit: params.permission ? this.$hasAccess(`${params.permission}.edit`) : true,
        destroy: params.permission ? this.$hasAccess(`${params.permission}.destroy`) : true
      };

      //Custom permissions
      if (params.customPermissions)
        for (var name in params.customPermissions)
          permissions[name] = this.$hasAccess(params.customPermissions[name]);

      //Repsonse
      return permissions;
    },
    //Default props
    defaultProps() {
      let defaultProps = { label: (this.params ? this.params.create.title : '') };

      switch (this.type) {
        case 'select':
          defaultProps = {
            outlined: true,
            dense: true,
            emitValue: true,
            'use-input': true,
            'map-options': true,
            ...defaultProps
          };
          break;
        case 'button-create':
          defaultProps = {
            icon: 'fas fa-plus',
            color: 'green',
            size: 'sm',
            ...defaultProps
          };
          break;
      }

      return { ...defaultProps, ...this.crudProps };
    },
    //Default configs
    defaultConfig() {
      let defaultConfig = {};

      switch (this.type) {
        case 'select':
          defaultConfig = {
            options: { label: 'title', value: 'id' },
            ...defaultConfig
          };
          break;
        case 'button-create':
          defaultConfig = {
            ...defaultConfig
          };
          break;
      }

      return { ...defaultConfig, ...this.config };
    },
    //Return params Props
    paramsProps() {
      if (!this.$refs.componentCrudData) return {};
      let crudData = this.$clone(this.$refs.componentCrudData.crudData || {});//
      crudData.hasPermission = this.hasPermission;//Add permission validated

      //Merge fields with dataFieldsCustom
      for (var fieldName in this.dataFieldsCustom) {
        if (crudData.formLeft && crudData.formLeft[fieldName])
          crudData.formLeft[fieldName].value = this.dataFieldsCustom[fieldName];
        if (crudData.formRight && crudData.formRight[fieldName])
          crudData.formRight[fieldName].value = this.dataFieldsCustom[fieldName];
      }

      //Merge with custom data
      if (this.customData && (typeof this.customData == 'object')) {
        for (var itemName in this.customData) {
          let itemValue = this.$clone(this.customData[itemName]);
          crudData[itemName] = (typeof itemValue == 'object') ? { ...crudData[itemName], ...itemValue } : itemValue;
          if (itemName == 'getDataForm') crudData[itemName] = this.customData[itemName];
        }
      }

      //Replece to itemCrudFields
      if (this.itemCrudFields) {
        crudData.formLeft = this.$clone(this.itemCrudFields);
        crudData.formRight = {};
      }

      //Validate if exist crudId
      crudData.crudId = crudData.crudId || this.$uid();

      //Response
      return crudData;
    }
  },
  methods: {
    init() {
      this.loadComponent();
    },
    //Load dynamic component
    async loadComponent() {
      const crudComponent = await this.crudData;
      if (crudComponent.default) this.componentCrudData = markRaw(crudComponent.default);
      this.$nextTick(function() {
        if (this.$refs.componentCrudData && this.$refs.componentCrudData.crudData) {
          this.params = this.$clone(this.$refs.componentCrudData.crudData);//asing crudData to params
          this.loading = false; //hidden Loading
          this.success = true;//udate success
          //Set value select
          this.setValueSelect();
          this.setSelectField();
          //Listen event to created
          eventBus.on(`${this.paramsProps.apiRoute}.crud.event.created`, (data) => {
            this.selectFieldKey = this.$uid();
            //Select the created record
            if (data.crudId == this.paramsProps.crudId) this.onCreate(data.data);
          });
        }
      });
    },
    //Define select field props
    setSelectField() {
      if (this.showType('select')) {
        let params = this.$clone(this.paramsProps);
        //Instance the field config
        this.selectField = {
          value: null,
          type: this.defaultConfig.filterByQuery ? 'select' : 'treeSelect',
          props: {
            key: this.$uid(),
            label: (this.params?.create.title || ''),
            clearable: false,
            sortValueBy: 'INDEX',
            searchNested: true,
            flat: this.crudProps.multiple,
            ...this.crudProps,
            imageField: this.imageField
          },
          loadOptions: {
            apiRoute: params.apiRoute,
            select: {
              ...this.defaultConfig.options,
              id: this.defaultConfig.options.value || 'id'
            },
            filterByQuery: this.defaultConfig.filterByQuery,
            requestParams: {
              ...(params.read.requestParams || {}),
              ...(this.defaultConfig.requestParams || {})
            },
            loadedOptions: this.defaultConfig.loadedOptions || null
          }
        };
      }
    },
    //watch emit create from index component
    create(dataCustom = {}) {
      if (this.hasPermission.create) {
        this.dataFieldsCustom = dataCustom;
        this.itemIdToEdit = false;
        this.fieldData = false;
        this.itemCrudFields = false;
        if (this.paramsProps.create.to) this.$router.push(this.paramsProps.create.to);
        else this.showModal = true;
      } else this.dialogPermissions.show = true;
    },
    //watch emit update from index component
    update(item) {
      //Validate if can update
      if (this.hasPermission.edit) {
        let params = this.paramsProps;
        //Set custom item crud fields
        if (item.crudFields) this.itemCrudFields = this.$clone(item.crudFields);
        //Set data to update
        if (item.id.field) this.fieldData = item.id.field;
        //Go to edit
        if (params.update.to) this.$router.push({ name: params.update.to, params: { id: item.id } });
        //Edit by method
        else if (params.update.method) params.update.method(item);
        else {
          this.itemIdToEdit = item.id;
          this.showModal = true;
        }
      } else this.dialogPermissions.show = true;
    },
    //Delete category
    delete(item) {
      this.$alert.error({
        mode: 'modal',
        title: `ID: ${item.id}`,
        message: this.$tr('isite.cms.message.deleteRecord'),
        actions: [
          { label: this.$tr('isite.cms.label.cancel'), color: 'grey' },
          {
            label: this.$tr('isite.cms.label.delete'),
            color: 'red',
            handler: () => {
              //Request
              this.$crud.delete(this.params.apiRoute, item.id).then(response => {
                //Alert
                this.$alert.info({ message: this.$tr('isite.cms.message.recordDeleted') });
                //Dispatch event hook
                this.$hook.dispatchEvent('wasDeleted', { entityName: this.params.entityName });
                //Event
                this.$emit('deleted');
              }).catch(error => {
                this.$alert.error({ message: this.$tr('isite.cms.message.recordNoDeleted'), pos: 'bottom' });
                this.loading = false;
              });
            }
          }
        ]
      });
    },
    //watch emit update from form component
    async formEmmit(type = 'created', response = false) {
      if (this.type == 'full') await this.getDataTable(true);
      this.$emit(type, response);
    },
    //Validate type to show
    showType(type) {
      if (!this.success) return false;
      let response = true;

      switch (type) {
        case 'full':
          if (!this.hasPermission.index) response = false;
          if (this.type != 'full') response = false;
          break;
        case 'select':
          if (!this.hasPermission.index) response = false;
          if (this.type != 'select') response = false;
          break;
        case 'button-create':
          if (!this.hasPermission.create) response = false;
          if (this.type != 'button-create') response = false;
          break;
      }

      return response;
    },
    //Set value to select
    setValueSelect(data = false) {
      let newValue = data || this.$clone(this.modelValue);
      let itemSelected = null;

      if (Array.isArray(newValue)) {
        itemSelected = newValue.map(item => item.toString());
      } else if (typeof newValue == 'object')
        itemSelected = newValue;
      else if (newValue)
        itemSelected = newValue.toString();

      //Set value
      this.itemSelected = itemSelected;
    },
    //Set value with last created item:
    onCreate(data) {
      if (this.showType('select')) {
        if (data) {
          if (Array.isArray(this.itemSelected)) { //multiple
            this.setValueSelect([...this.itemSelected, data.id]);
          } else if (!this.itemSelected) {
            const fieldData = this.defaultConfig?.options?.value || 'id'
            this.setValueSelect(data[fieldData]);
          }
        }
      }
    },
    //Emit value
    emitValue() {
      this.$emit('update:modelValue', this.itemSelected);
    },

    async getDataTable(refresh) {
      if (this.$refs.crudIndex) await this.$refs.crudIndex.getDataTable(refresh);
    },
    showEventListener() {
      const el = document.querySelector('.btnCreateCrud');
      if (el) {
        el.addEventListener('click', this.showCreateModal);
      }
    },
    showCreateModal(e) {
      this.create();
      e.stopPropagation();
    }
  }
};
</script>
<style lang="scss">
#crudContentPage {
  .btnCreate {
    padding: 3px 8px;

    .q-icon {
      margin-right: 5px;
      font-size: 12px;
    }

    .q-btn__content {
      font-size: 12px;
    }
  }

  .btnCreateCrud {
    .q-icon {
      margin-right: 5px;
      font-size: 12px;
    }

    .q-btn__content {
      font-size: 12px;
    }
  }
}
</style>
