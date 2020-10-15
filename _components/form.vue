<template>
  <!--Modal with form to category-->
  <q-dialog :id="params.modalId || 'modalFormCrud'" content-class="modal-form-crud"
            v-model="show" v-if="show" no-esc-dismiss no-backdrop-dismiss>
    <q-card :class="`bg-grey-1 backend-page row ${existFormRight ? 'col-2' : 'col-1'}`">
      <!--Header-->
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>
          <label v-if="!isUpdate && !field">{{params.create.title}}</label>
          <label v-else>{{params.update.title}} <span v-if="!field">ID: {{itemId}}</span></label>
        </q-toolbar-title>
        <q-btn flat @click="componentStore.remove()" v-close-popup icon="fas fa-times"/>
      </q-toolbar>

      <!--Content-->
      <q-card-section class="relative-position col-12" v-if="success">
        <!--Forms-->
        <q-form autocorrect="off" autocomplete="off" ref="formContent" class="row q-col-gutter-x-md col-12"
                @submit="(!isUpdate && !field) ?  createItem() : updateItem()"
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
            <div v-for="(field, key) in  params[pos]" :key="key" :ref="key">
              <!--Dynamic field to options-->
              <dynamic-field v-model="locale.formTemplate.options[field.name || key]" :key="key"
                             @input="setDynamicValues(field.name || key, field)"
                             :field="{...field, testId : (field.testId || field.name || key)}"
                             :language="locale.language" :item-id="itemId" :ref="`field-${field.name || key}`"
                             v-if="showField(field, (field.name || key)) && field.isFakeField"
                             @enter="$refs.formContent.submit()"/>
              <!--Dynamic field-->
              <dynamic-field v-model="locale.formTemplate[field.testId || field.name || key]" :key="key"
                             @input="setDynamicValues(field.name || key, field)"
                             :field="{...field, testId : (field.testId  || field.name || key)}"
                             :language="locale.language" :item-id="itemId" :ref="`field-${field.name || key}`"
                             v-if="showField(field, (field.name || key)) && !field.isFakeField"
                             @enter="$refs.formContent.submit()"/>
            </div>
          </div>
        </q-form>
        <!--Loading-->
        <inner-loading :visible="loading"/>
      </q-card-section>

      <!--Footer-->
      <q-toolbar class="q-pa-md">
        <q-toolbar-title></q-toolbar-title>
        <!--Button Save-->
        <q-btn icon="fas fa-save" color="positive" rounded unelevated
               v-if="!isUpdate && !field" :label="$tr('ui.label.save')"
               :loading="loading" @click="$refs.formContent.submit()"/>
        <!--Button Update-->
        <q-btn :label="$tr('ui.label.update')" icon="fas fa-pen" color="positive" rounded unelevated
               :loading="loading" @click="$refs.formContent.submit()" v-else/>
      </q-toolbar>
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
        locale: {fields: {options: {}}, fieldsTranslatable: {}},
        loading: false,
        dataField: []
      }
    },
    computed: {
      //Check if exist from right
      existFormRight() {
        if (this.params.formRight && Object.keys(this.params.formRight).length) {
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
            if (this.show && !this.params.field) {
              setTimeout(() => {
                //Get form data
                let componentData = this.$clone(this.locale.formTemplate)
                componentData.typeForm = this.isUpdate ? 'update' : 'create'
                //Create in store
                this.$store.dispatch('qcrudComponent/SET_COMPONENT', {
                  id: this.params.crudId, data: componentData
                })
              }, 500)
            }
          },
          update: () => {
            if (!this.params.field) {
              let formDataStore = this.$clone(this.$store.state.qcrudComponent.component[this.params.crudId])
              let formData = this.$clone(this.locale.formTemplate)
              let emiteForm = formDataStore ? false : true

              //Vlaidate if change some item from form
              if (!emiteForm)
                for (var itemName in formData)
                  if (JSON.stringify(formDataStore[itemName]) !== JSON.stringify(formData[itemName]))
                    emiteForm = true

              //Emit form data
              if (emiteForm)
                this.$store.dispatch('qcrudComponent/SET_DATA_COMPONENT', {
                  id: this.params.crudId, data: this.locale.formTemplate
                })
            }
          },
          remove: () => {
            if (!this.params.field)
              this.$store.dispatch('qcrudComponent/DELETE_COMPONENT', this.params.crudId)
          },
        }
      }
    },
    methods: {
      //Init form
      async initForm() {
        this.orderFields()//order fields to component locale
        this.show = this.value//Assign props value to show modal
        this.success = true//succesfull
        if (this.isUpdate || this.params.field) await this.getDataItem()//Get data item
        this.componentStore.create()//Create component in store
      },
      //Order fields of parms
      orderFields() {
        let params = this.$clone(this.params)
        let formLeft = params.formLeft || {}
        let formRight = params.formRight || {}
        let form = Object.assign({}, formLeft, formRight)

        //Init fields and validations to locales
        let fields = this.$clone(this.locale.fields)
        let fieldsTranslatables = this.$clone(this.locale.fieldsTranslatable)

        //Assign each field by type (translatable, fake field, just field) and validation
        Object.keys(form).forEach((key) => {
          let field = form[key]
          //Add to data locale to field
          if (field.isTranslatable) {
            fieldsTranslatables[field.name || key] = field.value
          } else if (field.isFakeField) {
            fields.options[field.name || key] = field.value
          } else {
            fields[field.name || key] = field.value
          }
        })

        //Assign fields and valitadions to locale
        this.locale.fields = this.$clone(fields)
        this.locale.fieldsTranslatable = this.$clone(fieldsTranslatables)
      },
      //Get data category to update
      getDataItem() {
        return new Promise((resolve, reject) => {
          this.loading = true
          let propParams = this.$clone(this.params)

          let params = {//Params to request
            refresh: true,
            params: propParams.update.requestParams || {}
          }

          //add filter
          if (!params.params.filter) params.params.filter = {}
          params.params.filter.allTranslations = true

          //Request if exist item ID
          if (!this.params.field) {
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
                name: this.params.field,
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
          let propParams = this.$clone(this.params)

          //Request
          this.$crud.create(propParams.apiRoute, this.getDataForm()).then(response => {
            this.$root.$emit(`${propParams.apiRoute}.crud.event.created`)//emmit event
            this.$alert.info({message: `${this.$tr('ui.message.recordCreated')}`})
            this.initForm()
            this.loading = false
            this.show = false
            this.$emit('created', this.getDataForm())
          }).catch(error => {
            this.$alert.error({message: `${this.$tr('ui.message.recordNoCreated')}`})
            this.loading = false//login hide
            if (error) {//Message Validate
              let errorMsg = JSON.parse(error)
              if (errorMsg.email) {
                this.$alert.error({
                  message: this.$tr('quser.layout.message.emailExist'),
                  pos: 'bottom', timeOut: 4000
                })
              } else {
                this.$alert.error({message: `${this.$tr('ui.message.recordNoCreated')}`})
              }
            }
          })
        }
      },
      //Update Category
      async updateItem() {
        if (await this.$refs.localeComponent.validateForm()) {
          this.loading = true
          let propParams = this.$clone(this.params)
          let criteria = this.$clone(this.itemId)

          //If is field update criteria
          if (this.params.field && this.dataField.id) criteria = this.dataField.id

          this.$crud.update(propParams.apiRoute, criteria, this.getDataForm()).then(response => {
            this.$root.$emit(`crudForm${propParams.apiRoute}Updated`)//emmit event
            this.$alert.info({message: this.$tr('ui.message.recordUpdated')})
            this.initForm()
            this.loading = false
            this.show = false
            this.$emit('updated', response.data)
          }).catch(error => {
            this.loading = false
            this.$alert.error({message: this.$tr('ui.message.recordNoUpdated')})
          })
        }
      },
      //Return data of form
      getDataForm() {
        //Clone data form
        let data = this.$clone(this.locale.form)
        let crudFields = {...(this.params.formLeft || {}), ...(this.params.formRight || {})}
        //Validate options
        if (data.options && !Object.keys(data.options).length) delete data.options

        //order if is field
        if (this.params.field) {
          if (this.field) {
            this.dataField.value[this.field.__index] = data
          }//Update field
          else {
            this.dataField.value.push(data)
          }//Add to data field

          //Format data field
          data = {
            userId: data.userId,
            name: this.params.field,
            value: this.dataField.value
          }
        }

        //Delete fields no crud
        for (var fieldname in crudFields) {
          if (crudFields[fieldname].noCrud) delete data[fieldname]
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

        //Response
        return response
      },
    }
  }
</script>

<style lang="stylus">
  .modal-form-crud
    .q-card
      max-height calc(100vh - 48px) !important

      .q-card__section
        min-height 250px
        max-height calc(100vh - 176px) !important
        overflow-y scroll

    .q-modal-content
      max-height 70vh !important
      @media screen and (max-width: $breakpoint-sm)
        max-height 100vh !important

      .q-modal-layout
        .q-layout-header
          position: absolute !important
          top 0
          width 100%

        .q-layout-footer
          position: absolute !important
          width 100%
          bottom 0

        .q-modal-layout-content
          max-height 70vh !important
          padding 50px 0
          @media screen and (max-width: $breakpoint-sm)
            min-height 100vh !important

    .col-1
      @media screen and (min-width: $breakpoint-sm)
        max-width 75vw !important
      @media screen and (min-width: $breakpoint-md)
        max-width 65vw !important
      @media screen and (min-width: $breakpoint-lg)
        max-width 45vw !important

    .col-2
      @media screen and (min-width: $breakpoint-sm)
        max-width 95vw !important
      @media screen and (min-width: $breakpoint-md)
        max-width 80vw !important
      @media screen and (min-width: $breakpoint-lg)
        max-width 65vw !important
</style>
