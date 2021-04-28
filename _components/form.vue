<template>
  <!--Modal with form to category-->
  <q-dialog :id="paramsProps.modalId || 'modalFormCrud'" content-class="modal-form-crud"
            v-model="show" persistent maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card id="cardContent" :class="`bg-grey-1 backend-page row ${existFormRight ? 'col-2' : 'col-1'}`">
      <!--Header-->
      <q-toolbar class="bg-primary text-white" v-if="paramsProps">
        <q-toolbar-title>
          <label v-if="!isUpdate && !field">{{ paramsProps.create.title }}</label>
          <label v-else>{{ paramsProps.update.title }} <span v-if="!field">ID: {{ itemId }}</span></label>
        </q-toolbar-title>
        <q-btn class="q-hide q-md-show" flat @click="componentStore.remove()" v-close-popup icon="fas fa-times"/>
      </q-toolbar>

      <!--Content-->
      <q-card-section class="relative-position col-12">
        <!--Forms-->
        <q-form autocorrect="off" autocomplete="off" ref="formContent" class="row q-col-gutter-x-md col-12"
                @submit="(!isUpdate && !field) ?  createItem() : updateItem()" v-if="success"
                @validation-error="$alert.error($tr('ui.message.formInvalid'))">
          <!--Language-->
          <div class="col-12 q-mb-md"
               v-show="locale.fieldsTranslatable && Object.keys(locale.fieldsTranslatable).length">
            <locales v-model="locale" ref="localeComponent" :form="$refs.formContent"/>
          </div>

          <!--Form-->
          <div v-for="(pos,key) in ['formLeft','formRight']" :key="pos" v-if="locale.success"
               :class="`col-12 ${existFormRight ? ((pos=='formLeft') ? 'col-md-7' : 'col-md-5') : ''}`">
            <!--Fields-->
            <div v-for="(field, key) in  paramsProps[pos]" :key="key" :ref="key">
              <!--Dynamic fake field-->
              <dynamic-field v-model="locale.formTemplate[field.fakeFieldName || 'options'][field.name || key]"
                             @input="setDynamicValues(field.name || key, field)" :key="key"
                             :field="{...field, testId : (field.testId || field.name || key)}"
                             :language="locale.language" :item-id="itemId" :ref="`field-${field.name || key}`"
                             v-if="showField(field, (field.name || key)) && (field.isFakeField || field.fakeFieldName)"
                             @enter="$refs.formContent.submit()"/>
              <!--Dynamic field-->
              <dynamic-field v-model="locale.formTemplate[field.name || key]" :key="key"
                             @input="setDynamicValues(field.name || key, field)"
                             :field="{...field, testId : (field.testId  || field.name || key)}"
                             :language="locale.language" :item-id="itemId" :ref="`field-${field.name || key}`"
                             v-if="showField(field, (field.name || key)) && !field.isFakeField && !field.fakeFieldName"
                             @enter="$refs.formContent.submit()"/>
            </div>
          </div>
        </q-form>
        <!--Loading-->
        <inner-loading :visible="loading"/>
      </q-card-section>

      <!--Footer desktop-->
      <div class="q-pa-md q-hide q-md-show text-right full-width">
        <!--Button Save-->
        <q-btn :icon="actionBottom.icon" :color="actionBottom.color" rounded unelevated
               :label="actionBottom.label" :loading="loading" @click="$refs.formContent.submit()"/>
      </div>
      <!--Footer mobile-->
      <div id="mobilActions" class="row q-md-hide full-width">
        <div class="col">
          <q-btn icon="fas fa-times" color="grey-5" text-color="grey-8" unelevated class="full-width full-height"
                 :label="$tr('ui.label.cancel')" v-close-popup/>
        </div>
        <div class="col">
          <q-btn :icon="actionBottom.icon" :color="actionBottom.color" unelevated class="full-width full-height"
                 :label="actionBottom.label" :loading="loading" @click="$refs.formContent.submit()"/>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  props: {
    value: {default: false},
    itemId: {default: false},
    field: {default: false},
    params: {default: false}
  },
  components: {},
  watch: {
    value(newValue) {
      this.show = this.value
    },
    show(newValue) {
      this.$emit('input', this.show)
      if (newValue) this.initForm()
    },
    'locale.formTemplate': {
      deep: true,
      handler: function (newValue) {
        this.componentStore.update()
      }
    },
    params: {
      deep: true,
      handler: function (newValue) {
        //Merge params
        this.paramsProps = this.$clone({
          ...this.params,
          formRight: {...(this.paramsProps.formRight || {}), ...(this.params.formRight || {})},
          formLeft: {...(this.paramsProps.formLeft || {}), ...(this.params.formLeft || {})},
        })
      }
    }
  },
  mounted() {
    this.$nextTick(function () {
      this.show = this.value
    })
  },
  data() {
    return {
      success: false,//global component status
      show: false,
      locale: {fields: {options: {}}, fieldsTranslatable: {}, form: {}},
      loading: true,
      dataField: [],
      paramsProps: false
    }
  },
  computed: {
    //Check if exist from right
    existFormRight() {
      if (this.paramsProps.formRight && Object.keys(this.paramsProps.formRight).length) {
        return true
      } else {
        return false
      }
    },
    //Validate if form is update
    isUpdate() {
      if (parseInt(this.itemId) >= 0) return true
      return false
    },
    //Actions to store component
    componentStore() {
      return {
        create: () => {
          setTimeout(() => {
            if (this.show && !this.paramsProps.field && this.locale.success) {
              //Get form data
              let componentData = this.$clone(this.locale.formTemplate)
              componentData.typeForm = this.isUpdate ? 'update' : 'create'
              //Create in store
              this.$store.dispatch('qcrudComponent/SET_COMPONENT', {
                id: this.paramsProps.crudId, data: componentData
              })
            }
          }, 500)
        },
        update: () => {
          if (!this.paramsProps.field && this.locale.success) {
            let formDataStore = this.$clone(this.$store.state.qcrudComponent.component[this.paramsProps.crudId])
            let formData = this.$clone(this.locale.formTemplate)
            let emitForm = formDataStore ? false : true

            //Validate if change some item from form
            if (!emitForm)
              for (var itemName in formData)
                if (JSON.stringify(formDataStore[itemName]) !== JSON.stringify(formData[itemName]))
                  emitForm = true

            //Emit form data
            if (emitForm)
              this.$store.dispatch('qcrudComponent/SET_DATA_COMPONENT', {
                id: this.paramsProps.crudId, data: this.locale.formTemplate
              })
          }
        },
        remove: () => {
          if (!this.paramsProps.field)
            this.$store.dispatch('qcrudComponent/DELETE_COMPONENT', this.paramsProps.crudId)
        },
      }
    },
    //Config action bottom
    actionBottom() {
      let response = {}
      if (!this.isUpdate && !this.field) {
        response = {
          icon: 'fas fa-save',
          color: 'green',
          label: this.$tr('ui.label.save')
        }
      } else {
        response = {
          icon: 'fas fa-pen',
          color: 'green',
          label: this.$tr('ui.label.update')
        }
      }
      //Response
      return response
    }
  },
  methods: {
    //Init form
    async initForm() {
      this.success = false//successful
      this.loading = true//loading
      this.locale = {fields: {options: {}}, fieldsTranslatable: {}, form: {}}//Reset locales
      this.paramsProps = this.$clone(this.params)
      await Promise.all([
        this.getExtraFields(),//Get extra fields to backend
        this.$hook.dispatchEvent(//Dispatch hook event
          (this.isUpdate ? 'isUpdating' : 'isCreating'),
          {entityName: this.params.entityName}
        ),
      ])
      this.orderFields()//order fields to component locale
      this.show = this.value//Assign props value to show modal
      this.success = true//successful
      if (this.isUpdate || this.paramsProps.field) await this.getDataItem()//Get data item
      this.componentStore.create()//Create component in store
      this.loading = false
    },
    //Get extra fields
    getExtraFields() {
      return new Promise((resolve, reject) => {
        if (!this.paramsProps.extraFormFields) return resolve(true)
        //Request params
        let requestParams = {
          refresh: true,
          params: {filter: {configName: this.paramsProps.extraFormFields}}
        }
        //Request
        this.$crud.index('apiRoutes.qsite.configs', requestParams).then(response => {
          //Add response to form
          if (response.data && Object.keys(response.data).length) {
            if (this.paramsProps.formRight && Object.keys(this.paramsProps.formRight))
              this.paramsProps.formRight = this.$clone({...this.paramsProps.formRight, ...response.data})
            else if (this.paramsProps.formLeft && Object.keys(this.paramsProps.formLeft))
              this.paramsProps.formLeft = this.$clone({...this.paramsProps.formLeft, ...response.data})
          }
          //Response
          resolve(response.data || [])
        }).catch(error => resolve(false))
      })
    },
    //Order fields of params
    orderFields() {
      let params = this.$clone(this.paramsProps)
      let formLeft = params.formLeft || {}
      let formRight = params.formRight || {}
      let form = Object.assign({}, formLeft, formRight)

      //Init fields and validations to locales
      let fields = this.$clone(this.locale.fields)
      let fieldsTranslatables = this.$clone(this.locale.fieldsTranslatable)

      //Assign each field by type (translatable, fake field, just field) and validation
      Object.keys(form).forEach((key) => {
        let field = form[key]
        //Validate field permission
        if (field.permission && !this.$auth.hasAccess(field.permission)) return
        //Add to data locale to field
        if (field.isTranslatable) {
          fieldsTranslatables[field.name || key] = field.value
        } else if (field.isFakeField) {
          fields.options[field.name || key] = field.value
        } else if (field.fakeFieldName) {
          if (!fields[field.fakeFieldName]) fields[field.fakeFieldName] = {}
          fields[field.fakeFieldName][field.name || key] = field.value
        } else {
          fields[field.name || key] = field.value
        }
      })

      //Assign fields and validations to locale
      this.locale.fields = this.$clone(fields)
      this.locale.fieldsTranslatable = this.$clone(fieldsTranslatables)
    },
    //Get data category to update
    getDataItem() {
      return new Promise((resolve, reject) => {
        this.loading = true
        let propParams = this.$clone(this.paramsProps)

        let params = {//Params to request
          refresh: true,
          params: propParams.update.requestParams || {}
        }

        //add filter
        if (!params.params.filter) params.params.filter = {}
        params.params.filter.allTranslations = true

        //Request if exist item ID
        if (!this.paramsProps.field) {
          //Request
          this.$crud.show(propParams.apiRoute, this.itemId, params).then(response => {
            this.locale.form = this.$clone(response.data)
            this.loading = false//hide loading
            resolve(true)
          }).catch(error => {
            this.$alert.error({message: this.$tr('ui.message.errorRequest'), pos: 'bottom'})
            this.loading = false//hide loading
            reject(false)
          })
        } else { //Request if exist field
          //Request
          this.$crud.index(propParams.apiRoute, params).then(response => {
            //Save data field
            this.dataField = {
              id: (response.data[0] && response.data[0].id) ? this.$clone(response.data[0].id) : null,
              name: this.paramsProps.field,
              value: (response.data[0] && response.data[0].value) ? this.$clone(response.data[0].value) : []
            }

            //Set data item if is update
            if (this.field) this.locale.form = this.$clone(this.field)

            this.loading = false//hide loading
            resolve(true)
          }).catch(error => {
            this.$alert.error(this.$tr('ui.message.errorRequest'))
            this.loading = false//hide loading
            reject(false)
          })
        }
      })
    },
    //Create Category
    async createItem() {
      if (await this.$refs.localeComponent.validateForm()) {
        this.loading = true
        let propParams = this.$clone(this.paramsProps)
        let formData = this.$clone(this.getDataForm())
        let requestInfo = {response: false, error: false}//Default request response

        //Request
        await new Promise((resolve, reject) => {
          if (propParams.create.method) {
            //Call custom method
            propParams.create.method(formData).then(response => {
              requestInfo.response = response
              return resolve(true)
            }).catch(error => {
              requestInfo.error = error
              return resolve(true)
            })
          } else {
            //Do request
            this.$crud.create(propParams.apiRoute, this.getDataForm()).then(response => {
              requestInfo.response = response
              return resolve(true)
            }).catch(error => {
              requestInfo.error = error
              return resolve(true)
            })
          }
        })

        //Action after request
        if (requestInfo.response) {
          this.$root.$emit(`${propParams.apiRoute}.crud.event.created`)//emmit event
          this.$alert.info({message: `${this.$tr('ui.message.recordCreated')}`})
          //Dispatch hook event
          await this.$hook.dispatchEvent('wasCreated', {entityName: this.params.entityName})
          this.loading = false
          this.show = false
          //this.initForm()
          this.$emit('created', this.getDataForm())
        } else {
          this.$alert.error({message: `${this.$tr('ui.message.recordNoCreated')}`})
          this.loading = false//login hide
          if (requestInfo.error) {//Message Validate
            let errorMsg = JSON.parse(requestInfo.error)
            if (errorMsg.email) {
              this.$alert.error({
                message: this.$tr('quser.layout.message.emailExist'),
                pos: 'bottom', timeOut: 4000
              })
            } else {
              this.$alert.error({message: `${this.$tr('ui.message.recordNoCreated')}`})
            }
          }
        }
      }
    },
    //Update Category
    async updateItem() {
      if (await this.$refs.localeComponent.validateForm()) {
        this.loading = true
        let propParams = this.$clone(this.paramsProps)
        let criteria = this.$clone(this.itemId)
        let requestInfo = {response: false, error: false}//Default request response
        let formData = this.$clone(this.getDataForm())

        //If is field update criteria
        if (this.paramsProps.field && this.dataField.id) criteria = this.dataField.id

        //Request
        await new Promise((resolve, reject) => {
          if (propParams.update.method) {
            //Call custom method
            propParams.update.method(criteria, formData).then(response => {
              requestInfo.response = response
              return resolve(true)
            }).catch(error => {
              requestInfo.error = error
              return resolve(true)
            })
          } else {
            this.$crud.update(propParams.apiRoute, criteria, formData).then(response => {
              requestInfo.response = response
              return resolve(true)
            }).catch(error => {
              requestInfo.error = error
              return resolve(true)
            })
          }
        })

        //Action after request
        if (requestInfo.response) {
          this.$root.$emit(`crudForm${propParams.apiRoute}Updated`)//emmit event
          this.$alert.info({message: this.$tr('ui.message.recordUpdated')})
          //Dispatch hook event
          await this.$hook.dispatchEvent('wasUpdated', {entityName: this.params.entityName})
          this.loading = false
          this.show = false
          //this.initForm()
          this.$emit('updated', requestInfo.response.data)
        } else {
          this.loading = false
          this.$alert.error({message: this.$tr('ui.message.recordNoUpdated')})
        }
      }
    },
    //Return data of form
    getDataForm() {
      //Clone data form
      let data = this.$clone(this.locale.form)
      let crudFields = {...(this.paramsProps.formLeft || {}), ...(this.paramsProps.formRight || {})}
      //Validate options
      if (data.options && !Object.keys(data.options).length) delete data.options

      //order if is field
      if (this.paramsProps.field) {
        if (this.field) {
          this.dataField.value[this.field.__index] = data
        }//Update field
        else {
          this.dataField.value.push(data)
        }//Add to data field

        //Format data field
        data = {
          userId: data.userId,
          name: this.paramsProps.field,
          value: this.dataField.value
        }
      }

      //Delete fields no crud
      for (var fieldName in crudFields) {
        if (crudFields[fieldName].noCrud) delete data[fieldName]
      }

      return data//Response
    },
    //format slug
    setDynamicValues(fieldName, field) {
      setTimeout(() => {
        let formTemplate = this.$clone(this.locale.formTemplate)//Get form template

        //Format Slug
        if ((['title', 'name', 'slug'].indexOf(fieldName) != -1) && (this.locale.formTemplate.slug != undefined)) {
          let slug = this.isUpdate ? false : (formTemplate.name || formTemplate.title || false)//Default data to slug
          if ((fieldName == 'slug') && formTemplate.slug) slug = formTemplate.slug.replace(/-/g, ' ')//Format slug
          if (slug) this.locale.formTemplate.slug = this.$clone(this.$helper.getSlug(slug))
        }

        //Add categories
        if ((fieldName == 'categoryId') && (this.locale.formTemplate.categories != undefined)) {
          //Get component
          let component = this.$refs[`field-categoryId`]
          if (component) component = component[0]
          //Get categories from component
          let options = this.$clone(component ? (component.rootOptions || false) : false)
          //Set categories
          if (options && options.length) {
            //Get parents of category
            let parents = this.$array.parents(
              this.$array.destroyTree(options),
              this.locale.formTemplate.categoryId
            )
            //Add categories values
            if (parents && parents.id && parents.id.length) {
              let categoriesId = parents.id.map(String)//Parse Id's
              //Merge categories
              this.locale.formTemplate.categories.forEach(item => {
                if (categoriesId.indexOf(item) == -1) categoriesId.push(item)
              })
              //Set to categories
              this.locale.formTemplate.categories = this.$clone(categoriesId)
            }
          }
        }
      }, 100)
    },
    //validate if should show field
    showField(field, fieldName) {
      let response = true//Default response

      //Check if is field "masterRecord" and check permission
      if (field.isFakeField && (fieldName == 'masterRecord')) {
        //Validate permission to create
        if (!this.isUpdate && !this.$store.getters['quserAuth/hasAccess']('isite.master.records.create')) {
          response = false
        }

        //Validate permission to update
        if (this.isUpdate && !this.$store.getters['quserAuth/hasAccess']('isite.master.records.edit')) {
          response = false
        }
      }

      //validate field permission
      if (field.permission && !this.$auth.hasAccess(field.permission)) response = false

      //Response
      return response
    },
  }
}
</script>

<style lang="stylus">
.modal-form-crud
  #cardContent
    max-height calc(100vh - 48px) !important

    .q-card__section
      min-height 250px
      max-height calc(100vh - 176px) !important
      overflow-y scroll
    @media screen and (max-width: $breakpoint-md)
      max-height 100vh !important
      height 100vh
      .q-card__section
        max-height 100vh !important
        height calc(100vh - 95px)

  .col-1
    width 100vw
    @media screen and (min-width: $breakpoint-sm)
      max-width 100vw !important
    @media screen and (min-width: $breakpoint-md)
      max-width 65vw !important
    @media screen and (min-width: $breakpoint-lg)
      max-width 45vw !important

  .col-2
    width 100vw
    @media screen and (min-width: $breakpoint-sm)
      max-width 100vw !important
    @media screen and (min-width: $breakpoint-md)
      max-width 80vw !important
    @media screen and (min-width: $breakpoint-lg)
      max-width 65vw !important

  #mobilActions
    max-height 45px
    height 45px

    .q-btn
      border-radius 0
</style>
