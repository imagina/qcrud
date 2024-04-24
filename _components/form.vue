<template>
  <!--Modal with form to category-->
  <div>
    <master-modal
      :id="paramsProps.modalId || 'modalFormCrud'" v-model="show" v-bind="modalProps"
      @hide="componentStore.remove()" custom-position :persistent="true">
      <div class="modal-crud">
        <div id="cardContent" :class="`row ${existFormRight ? 'col-2' : 'col-1'}`">
          <div class="relative-position col-12">
            <!--Forms-->
            <dynamic-field
              v-if="fieldBanner"
              :field="fieldBanner"
            />
            <q-form
              autocorrect="off"
              autocomplete="off"
              ref="formContent"
              class="row q-col-gutter-md col-12"
              @submit="(!isUpdate && !field) ?  createItem() : updateItem()"
              v-if="success"
              @validation-error="$alert.error($tr('isite.cms.message.formInvalid'))"
            >
              <!--Language-->
              <div
                :class="locale.languages && (locale.languages.length >= 2) ? 'col-12' : 'q-pa-none'"
                v-show="locale.fieldsTranslatable && Object.keys(locale.fieldsTranslatable).length"
              >
                <locales
                  v-model="locale"
                  ref="localeComponent"
                  :form="$refs.formContent"
                />
              </div>

              <!--Form-->
              <template v-for="(pos,key) in ['formLeft','formRight']" :key="pos">
                <div
                  v-if="locale.success && paramsProps[pos] && Object.keys(paramsProps[pos]).length"
                  :class="`col-12 ${existFormRight ? ((pos=='formLeft') ? 'col-md-7' : 'col-md-5') : ''}`"
                >
                  <div>
                    <!--Fields-->
                    <div v-for="(field, key) in customFieldProps[pos]" :key="key" :ref="key">
                      <!--Dynamic fake field-->
                      <dynamic-field
                        v-model="locale.formTemplate[field.fakeFieldName || 'options'][field.name || key]"
                        @update:modelValue="setDynamicValues(field.name || key, field)"
                        :key="key"
                        :field="{...field, testId: (field.testId || field.name || key)}"
                        :language="locale.language" :item-id="itemId"
                        :ref="`field-${field.name || key}`"
                        v-if="showField(field, (field.name || key)) && (field?.isFakeField || field.fakeFieldName)"
                        @enter="$refs.formContent.submit()"
                      />
                      <!--Dynamic field-->
                      <dynamic-field
                        v-model="locale.formTemplate[field.name || key]"
                        :key="key"
                        @update:modelValue="setDynamicValues(field.name || key, field)"
                        :field="{...field, testId: (field.testId  || field.name || key)}"
                        :language="locale.language" :item-id="itemId"
                        :ref="`field-${field.name || key}`"
                        v-if="showField(field, (field.name || key)) && !field?.isFakeField && !field.fakeFieldName"
                        @enter="$refs.formContent.submit()"
                      />
                    </div>
                  </div>
                </div>
              </template>
            </q-form>
          </div>
        </div>
      </div>
    </master-modal>
  </div>
</template>

<script>
import { cacheOffline } from 'src/plugins/utils';
import { eventBus } from 'src/plugins/utils'
import { debounce } from 'quasar'

export default {
  props: {
    modelValue: { default: false },
    itemId: { default: false },
    field: { default: false },
    params: { default: false }
  },
  emits: ['update:modelValue', 'created', 'createdData', 'updated'],
  components: {},
  watch: {
    modelValue(newValue) {
      this.show = this.$clone(newValue);
    },
    show(newValue) {
      this.$emit('update:modelValue', this.show);
      if (newValue) this.initForm();
    },
    'locale.formTemplate': {
      deep: true,
      handler: function(newValue) {
        this.fillFormUpdates()
      }
    },
    params: {
      deep: true,
      handler: function(newValue) {
        //Merge params
        this.paramsProps = this.$clone({
          ...this.params,
          formRight: { ...(this.paramsProps.formRight || {}), ...(this.params.formRight || {}) },
          formLeft: { ...(this.paramsProps.formLeft || {}), ...(this.params.formLeft || {}) }
        });
      }
    }
  },
  mounted() {
    this.$nextTick(function() {
      this.show = this.modelValue;
    });
  },
  data() {
    return {
      success: false,//global component status
      show: false,
      locale: { fields: { options: {} }, fieldsTranslatable: {}, form: {} },
      loading: true,
      dataField: [],
      paramsProps: false
    };
  },
  computed: {
    isAppOffline() {
      return this.$store.state.qofflineMaster.isAppOffline;
    },
    //modal props
    modalProps() {
      //Validate params props
      if (!this.paramsProps) return {};

      //Response
      return {
        title: (!this.isUpdate && !this.field) ? this.paramsProps.create.title :
          `${this.paramsProps.update.title} ${!this.field ? ('ID: ' + this.itemId) : ''}`,
        width: 'max-content',
        loading: this.loading,
        actions: [
          {
            props: {
              color: 'green',
              label: (!this.isUpdate && !this.field) ? this.$tr('isite.cms.label.save') : this.$tr('isite.cms.label.update')
            },
            action: () => this.$refs.formContent.submit()
          }
        ]
      };
    },
    //Check if exist from right
    existFormRight() {
      if (this.paramsProps.formRight && Object.keys(this.paramsProps.formRight).length) {
        return true;
      } else {
        return false;
      }
    },
    //Validate if form is update
    isUpdate() {
      if (this.itemId === undefined) return false;
      if (this.itemId === null) return false;
      if (this.itemId === false) return false;
      return true;
    },
    fieldBanner() {
      const description = this.isUpdate
        ? this.paramsProps?.update?.description
        : this.paramsProps?.create?.description;

      if (!description) return null;

      return {
        type: 'banner',
        props: {
          color: 'blue-grey-4',
          icon: 'fas fa-exclamation-triangle',
          message: description
        }
      };
    },
    //Actions to store component
    componentStore() {
      return {
        create: () => {
          setTimeout(() => {
            if (this.show && !this.paramsProps.field && this.locale.success) {
              //Get form data
              let componentData = this.$clone(this.locale.formTemplate);
              componentData.typeForm = this.isUpdate ? 'update' : 'create';
              //Create in store
              this.$store.dispatch('qcrudComponent/SET_COMPONENT', {
                id: this.paramsProps.crudId, data: componentData
              });
            }
          }, 500);
        },
        update: async () => {
          if (!this.paramsProps.field && this.locale.success) {
            let formDataStore = this.$clone(this.$store.state.qcrudComponent.component[this.paramsProps.crudId]);
            let formData = this.$clone(this.locale.formTemplate);
            let changedFields = [];

            //Validate if change some item from form
            if (formDataStore) {
              for (var itemName in formData)
                if (JSON.stringify(formDataStore[itemName]) !== JSON.stringify(formData[itemName]))
                  changedFields.push(itemName);
            }

            //Emit form data
            if (changedFields.length || !formDataStore) {
              // Emit change for extra modifcation
              if (this.paramsProps.handleFormUpdates) {
                formData = await this.paramsProps.handleFormUpdates(formData, changedFields, this.formType);
              }
              // Set the data in the CRUD store
              this.$store.dispatch('qcrudComponent/SET_DATA_COMPONENT', {
                id: this.paramsProps.crudId, data: formData
              });
              //set in the formTemplate
              this.locale.formTemplate = this.$clone(formData);
            }
          }
        },
        remove: () => {
          if (!this.paramsProps.field)
            this.$store.dispatch('qcrudComponent/DELETE_COMPONENT', this.paramsProps.crudId);
        }
      };
    },
    customFieldProps() {
      const customFormProps = this.isUpdate
        ? this.paramsProps?.update?.customFormProps
        : this.paramsProps?.create?.customFormProps;

      const paramsProps = this.$clone(this.paramsProps);

      if (customFormProps) {
        return this.injectProps(customFormProps, paramsProps);
      }

      return this.paramsProps;
    },
    //return the formType
    formType() {
      return this.isUpdate ? 'update' : 'create';
    }
  },
  methods: {
    //Init form
    async initForm() {
      this.success = false;//successful
      this.loading = true;//loading
      this.locale = { fields: { options: {} }, fieldsTranslatable: {}, form: {} };//Reset locales
      this.paramsProps = this.$clone(this.params);
      await Promise.all([
        this.getExtraFields(),//Get extra fields to backend
        this.$hook.dispatchEvent(//Dispatch hook event
          (this.isUpdate ? 'isUpdating' : 'isCreating'),
          { entityName: this.params.entityName }
        )
      ]);
      this.orderFields();//order fields to component locale
      this.show = this.modelValue;//Assign props value to show modal
      this.success = true;//successful
      if (this.isUpdate || this.paramsProps.field) await this.getDataItem();//Get data item
      this.componentStore.create();//Create component in store
      this.loading = false;
    },
    messageWindow(type, message) {
      if (!this.isAppOffline) {
        this.$alert[type](message);
      }
    },
    //Get extra fields
    getExtraFields() {
      return new Promise((resolve, reject) => {
        if (!this.paramsProps.extraFormFields) return resolve(true);
        //Request params
        let requestParams = {
          refresh: true,
          params: {
            filter: { configName: this.paramsProps.extraFormFields },
            titleOffline: this.modalProps.title || ''
          }
        };
        //Request
        this.$crud.index('apiRoutes.qsite.configs', requestParams).then(response => {
          //Add response to form
          if (response.data && Object.keys(response.data).length) {
            if (this.paramsProps.formRight && Object.keys(this.paramsProps.formRight))
              this.paramsProps.formRight = this.$clone({ ...this.paramsProps.formRight, ...response.data });
            else if (this.paramsProps.formLeft && Object.keys(this.paramsProps.formLeft))
              this.paramsProps.formLeft = this.$clone({ ...this.paramsProps.formLeft, ...response.data });
          }
          //Response
          resolve(response.data || []);
        }).catch(error => {
          this.$apiResponse.handleError(error, () => {
            resolve(false);
          });
        });
      });
    },
    //Order fields of params
    orderFields() {
      let params = this.$clone(this.paramsProps);
      let formLeft = params.formLeft || {};
      let formRight = params.formRight || {};
      let form = Object.assign({}, formLeft, formRight);

      //Init fields and validations to locales
      let fields = this.$clone(this.locale.fields);
      let fieldsTranslatables = this.$clone(this.locale.fieldsTranslatable);

      //Assign each field by type (translatable, fake field, just field) and validation
      Object.keys(form).forEach((key) => {
        let field = form[key];
        //Validate field permission
        if (field.permission && !this.$hasAccess(field.permission)) return;
        //Add to data locale to field
        if (field.isTranslatable) {
          fieldsTranslatables[field.name || key] = field.value;
        } else if (field?.isFakeField) {
          fields.options[field.name || key] = field.value;
        } else if (field.fakeFieldName) {
          if (!fields[field.fakeFieldName]) fields[field.fakeFieldName] = {};
          fields[field.fakeFieldName][field.name || key] = field.value;
        } else {
          fields[field.name || key] = field.value;
        }
      });

      //Assign fields and validations to locale
      this.locale.fields = this.$clone(fields);
      this.locale.fieldsTranslatable = this.$clone(fieldsTranslatables);
    },
    //Get data category to update
    getDataItem() {
      return new Promise((resolve, reject) => {
        this.loading = true;
        let propParams = this.$clone(this.paramsProps);

        let params = {//Params to request
          refresh: true,
          params: propParams.update.requestParams || {}
        };

        //add filter
        if (!params.params.filter) params.params.filter = {};
        params.params.filter.allTranslations = true;

        //Request if exist item ID
        if (!this.paramsProps.field) {
          //Request
          if (this.isAppOffline) {
            cacheOffline.getItemById(this.itemId, propParams.apiRoute)
              .then(response => {
                this.locale.form = this.$clone(response);
                resolve(true);
              })
              .catch(err => {
                reject(err);
              })
              .finally(() => {
                this.loading = false;
              });
            return;
          }

          this.$crud.show(propParams.apiRoute, this.itemId, params).then(response => {
            this.locale.form = this.$clone(response.data);
            this.loading = false;//hide loading
            resolve(true);
          }).catch(error => {
            this.$apiResponse.handleError(error, () => {

              this.messageWindow('error', {
                message: this.$tr('isite.cms.message.errorRequest'),
                pos: 'bottom'
              });
              this.loading = false;//hide loading
              reject(false);
            });
          });
        } else { //Request if exist field
          //Request
          this.$crud.index(propParams.apiRoute, params).then(response => {
            //Save data field
            this.dataField = {
              id: (response.data[0] && response.data[0].id) ? this.$clone(response.data[0].id) : null,
              name: this.paramsProps.field,
              value: (response.data[0] && response.data[0].value) ? this.$clone(response.data[0].value) : []
            };

            //Set data item if is update
            if (this.field) this.locale.form = this.$clone(this.field);

            this.loading = false;//hide loading
            resolve(true);
          }).catch(error => {
            this.$apiResponse.handleError(error, () => {

              this.messageWindow('error', this.$tr('isite.cms.message.errorRequest'));
              this.loading = false;//hide loading
              reject(false);
            });
          });
        }
      });
    },
    //Create Category
    async saveInCache(apiRoute, response = null, formData) {
      const data = response || formData;
      await cacheOffline.addNewRecord(apiRoute, data);
    },
    async createItem() {
      if (await this.$refs.localeComponent.validateForm()) {
        this.loading = true;
        let propParams = this.$clone(this.paramsProps);
        let formData = this.$clone(await this.getDataForm());
        let requestInfo = { response: false, error: false };//Default request response

        try {
          if (propParams.create.method) {
            requestInfo.response = await propParams.create.method(formData);
          } else {
            try {
              requestInfo.response = await this.$crud.create(
                propParams.apiRoute,
                { ...formData, titleOffline: this.modalProps.title || '' },
                propParams.create?.requestParams || {}
              );
            } catch (err) {
              requestInfo.error = err;
            }
            await this.saveInCache(propParams.apiRoute, requestInfo.response?.data, formData);
            if (this.isAppOffline) requestInfo.response = true;
          }
        } catch (err) {
          requestInfo.error = err;
        }

        //Action after request
        if (requestInfo.response) {
          eventBus.emit(`${propParams.apiRoute}.crud.event.created`);//emmit event

          this.messageWindow(
            'info',
            { message: `${this.$tr('isite.cms.message.recordCreated')}` }
          );
          //Dispatch hook event
          await this.$hook.dispatchEvent('wasCreated', { entityName: this.params.entityName });
          this.loading = false;
          this.show = false;
          //this.initForm()
          this.$emit('created', formData);
          this.$emit('createdData', requestInfo.response.data);
          if (this.params.create?.callback) this.params.create.callback(requestInfo.response.data);
        } else {

          this.messageWindow(
            'error',
            { message: `${this.$tr('isite.cms.message.recordNoCreated')}` }
          );
          this.loading = false;//login hide
          if (requestInfo.error) {//Message Validate
            let errorMsg = JSON.parse(requestInfo.error);
            if (errorMsg.email) {
              this.$alert.error({
                message: this.$tr('iprofile.cms.message.emailExist'),
                pos: 'bottom', timeOut: 4000
              });

            } else {

              this.messageWindow(
                'error',
                { message: `${this.$tr('isite.cms.message.recordNoCreated')}` }
              );
            }
          }
        }

      }
    },
    async executeUpdateRequest() {
      const propParams = this.$clone(this.paramsProps);
      const formData = this.$clone(await this.getDataForm());
      const requestParams = propParams.update?.requestParams || {};
      const customParams = {
        ...(requestParams),
        params: {
          titleOffline: this.modalProps.title || '',
          ...(requestParams?.params || {}),
        },
      };
      let criteria = this.$clone(this.itemId);
      let response = null;
      let errorResponse = null;

      //If is field update criteria
      if (this.paramsProps.field && this.dataField.id) criteria = this.dataField.id;

      try {
        if (propParams.update.method) {
          // Call custom method
          response = await propParams.update.method(criteria, formData, customParams);
        } else {
          await cacheOffline.updateRecord(propParams.apiRoute, formData, criteria);

          response = await this.$crud.update(
            propParams.apiRoute,
            criteria,
            formData,
            customParams
          );
        }
      } catch (error) {
        errorResponse = error;
      }

      return {
        response,
        errorResponse
      };
    },
    //Update Category
    async updateItem() {
      if (await this.$refs.localeComponent.validateForm()) {
        this.loading = true;
        const propParams = this.$clone(this.paramsProps);
        let requestInfo = { response: false, error: false };//Default request response

        const response = await this.executeUpdateRequest();
        requestInfo.response = await response.response;
        requestInfo.error = await response.errorResponse;

        if (this.isAppOffline) {
          requestInfo.response = true;
        }

        //Action after request
        if (requestInfo.response) {
          eventBus.emit(`crudForm${propParams.apiRoute}Updated`);//emmit event

          this.messageWindow(
            'info',
            { message: this.$tr('isite.cms.message.recordUpdated') }
          );
          //Dispatch hook event
          await this.$hook.dispatchEvent('wasUpdated', { entityName: this.params.entityName });
          this.loading = false;
          this.show = false;
          //this.initForm()
          this.$emit('updated', requestInfo.response.data);
          if (this.params.update?.callback) this.params.update.callback(requestInfo.response.data);
        } else {
          this.loading = false;

          this.messageWindow(
            'error',
            { message: this.$tr('isite.cms.message.recordNoUpdated') }
          );
        }
      }
    },
    injectProps(customFormProps, paramsProps) {
      ['formLeft', 'formRight'].forEach(type => {
        Object.keys(paramsProps[type]).forEach(fieldName => {
          if (customFormProps[fieldName]) {
            paramsProps[type][fieldName] = {
              ...paramsProps[type][fieldName],
              ...customFormProps[fieldName],
              props: {
                ...(paramsProps[type][fieldName].props || {}),
                ...(customFormProps[fieldName].props || {})
              }
            };
          }
        });
      });
      return paramsProps;
    },
    //Return data of form
    getDataForm() {
      return new Promise(async (resolve, reject) => {
        //Clone data form
        let data = this.$clone(this.locale.form);
        let crudFields = { ...(this.paramsProps.formLeft || {}), ...(this.paramsProps.formRight || {}) };
        //Validate options
        if (data.options && !Object.keys(data.options).length) delete data.options;

        //order if is field
        if (this.paramsProps.field) {
          if (this.field) {
            this.dataField.value[this.field.__index] = data;
          }//Update field
          else {
            this.dataField.value.push(data);
          }//Add to data field

          //Format data field
          data = {
            userId: data.userId,
            name: this.paramsProps.field,
            value: this.dataField.value
          };
        }

        //Delete fields no crud
        for (var fieldName in crudFields) {
          if (crudFields[fieldName].noCrud) delete data[fieldName];
        }

        //Call custom Get Data Form
        if (this.paramsProps.getDataForm) {
          data = await this.paramsProps.getDataForm(this.$clone(data), this.formType);
        }
        //Response
        resolve(data);
      });
    },
    //format slug
    setDynamicValues(fieldName, field) {
      setTimeout(() => {
        let formTemplate = this.$clone(this.locale.formTemplate);//Get form template

        //Format Slug
        if ((['title', 'name', 'slug'].indexOf(fieldName) != -1) && (this.locale.formTemplate.slug != undefined)) {
          let slug = this.isUpdate ? false : (formTemplate.name || formTemplate.title || false);//Default data to slug
          if ((fieldName == 'slug') && formTemplate.slug) slug = formTemplate.slug;
          if (slug) this.locale.formTemplate.slug = this.$clone(this.$helper.getSlug(slug));
        }
        //Add categories
        if ((fieldName == 'categoryId') && (this.locale.formTemplate.categories != undefined)) {
          //Get component
          let component = this.$refs[`field-categoryId`];
          if (component) component = component[0];
          //Get categories from component
          let options = this.$clone(component ? (component.rootOptions || false) : false);
          //Set categories
          if (options && options.length) {
            //Get parents of category
            let parents = this.$array.parents(
              this.$array.destroyTree(options),
              this.locale.formTemplate.categoryId
            );
            //Add categories values
            if (parents && parents.id && parents.id.length) {
              let categoriesId = parents.id.map(String);//Parse Id's
              //Merge categories
              this.locale.formTemplate.categories.forEach(item => {
                if (categoriesId.indexOf(item) == -1) categoriesId.push(item);
              });
              //Set to categories
              this.locale.formTemplate.categories = this.$clone(categoriesId);
            }
          }
        }
      }, 100);
    },
    //validate if should show field
    showField(field, fieldName) {
      let response = true;//Default response

      //Check if is field "masterRecord" and check permission
      if (field?.isFakeField && (fieldName == 'masterRecord')) {
        //Validate permission to create
        if (!this.isUpdate && !this.$hasAccess('isite.master.records.create')) {
          response = false;
        }

        //Validate permission to update
        if (this.isUpdate && !this.$hasAccess('isite.master.records.edit')) {
          response = false;
        }
      }

      //validate field permission
      if (field.permission && !this.$hasAccess(field.permission)) response = false;

      //Response
      return response;
    },
    //Debounce the fillFormUpdates
    fillFormUpdates: _.debounce(function(formData) {
      //set in the formTemplate
      this.componentStore.update()
    }, 100)
  }
};
</script>
