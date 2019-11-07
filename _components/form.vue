<template>
  <!--Modal with form to category-->
  <q-dialog id="modalFormCrud" v-model="show" v-if="show"
            no-esc-dismiss no-backdrop-dismiss>
    <q-card :class="`bg-grey-1 backend-page row ${existFormRight ? 'col-2' : 'col-1'}`">
      <!--Header-->
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>
          <label v-if="!itemId && !field">{{params.create.title}}</label>
          <label v-else>{{params.update.title}} <span v-if="!field">ID: {{itemId}}</span></label>
        </q-toolbar-title>
        <q-btn flat v-close-popup icon="fas fa-times"/>
      </q-toolbar>

      <!--Content-->
      <q-card-section class="relative-position col-12" v-if="success">
        <!--Forms-->
        <q-form autocorrect="off" autocomplete="off" ref="formContent" class="row q-col-gutter-x-md col-12"
                @submit="(!itemId && !field) ?  createItem() : updateItem()"
                @validation-error="$alert.error($tr('ui.message.formInvalid'))">
          <!--Language-->
          <div class="col-12 q-mb-md"
               v-show="locale.fieldsTranslatable && Object.keys(locale.fieldsTranslatable).length">
            <locales v-model="locale" ref="localeComponent" :form="$refs.formContent"/>
          </div>

          <!--Form-->
          <div v-for="(pos,key) in ['formLeft','formRight']" :key="pos"
               :class="`col-12 ${existFormRight ? ((pos=='formLeft') ? 'col-md-7' : 'col-md-5') : ''}`"
               v-if="locale.success">
            <!--Fields-->
            <div v-for="(field, key) in  params[pos]" :key="key" :ref="key">
              <!--Toogle password-->
              <q-checkbox v-if="itemId && (field.type == 'password')" class="q-mt-sm"
                          v-model="updatePassword" :label="$tr('ui.message.updatePassword')"/>
              <!--Dynamic field to options-->
              <dynamic-field v-model="locale.formTemplate.options[field.name || key]" :key="key"
                             @input="setSlug(field.name || key)" :field="field"
                             :language="locale.language" :item-id="itemId"
                             v-if="showField(field, (field.name || key)) && field.isFakeField"
                             @enter="$refs.formContent.submit()"/>
              <!--Dynamic field-->
              <dynamic-field v-model="locale.formTemplate[field.name || key]" :key="key"
                             @input="setSlug(field.name || key)" :field="field"
                             :language="locale.language" :item-id="itemId"
                             v-if="showField(field, (field.name || key)) && !field.isFakeField"
                             @enter="$refs.formContent.submit()"/>
            </div>
          </div>
        </q-form>
        <!--Loading-->
        <inner-loading :visible="loading"/>
      </q-card-section>

      <!--Footer-->
      <q-toolbar>
        <q-toolbar-title></q-toolbar-title>
        <!--Button Save-->
        <q-btn icon="fas fa-save" color="positive"
               v-if="!itemId && !field" :label="$tr('ui.label.save')"
               :loading="loading" @click="$refs.formContent.submit()"/>
        <!--Button Update-->
        <q-btn :label="$tr('ui.label.update')" icon="fas fa-pen" color="positive"
               :loading="loading" @click="$refs.formContent.submit()" v-else/>
      </q-toolbar>
    </q-card>
  </q-dialog>
</template>

<script>
  import recursiveSelect from '@imagina/qsite/_components/master/recursiveListSelect'

  export default {
    props: {
      value: {default: false},
      itemId: {default: false},
      field: {default: false},
      params: {default: false}
    },
    components: {
      recursiveSelect
    },
    watch: {
      value(newValue) {
        this.show = this.value
      },
      show(newValue) {
        this.$emit('input', this.show)
        this.initForm()
      }
    },
    mounted() {
      this.$nextTick(function () {
        this.initForm()
      })
    },
    data() {
      return {
        success: false,//global component status
        show: false,
        locale: {fields: {options: {}}, fieldsTranslatable: {}, validations: {}},
        loading: false,
        updatePassword: false,//Permit edit password
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
    },
    methods: {
      //Init form
      async initForm() {
        this.orderFields()//order fields to component locale
        this.show = this.value//Assign props value to show modal
        this.success = true//succesfull
        if (this.itemId || this.params.field) await this.getDataItem()//Get data item
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
        let validations = this.$clone(this.locale.validations)

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
          //Create validations
          if (field.isRequired) {
            //validations[field.name || key] = this.getValidationByFieldType(field.type)
          }//Set validations
        })

        //Assign fields and valitadions to locale
        this.locale.fields = this.$clone(fields)
        this.locale.fieldsTranslatable = this.$clone(fieldsTranslatables)
        this.locale.validations = this.$clone(validations)
      },
      //Return message validation by field type
      getValidationMessage(type) {
        let response = this.$tr('ui.message.fieldRequired')//Default message

        switch (type) {
          case 'email'://=== Check Password
            response = this.$tr('ui.message.fieldEmail')
            break
          case 'checkPassword'://=== Check Password
            response = this.$tr('ui.message.fieldCheckPassword')
            break
        }

        return response//Response
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
          if (this.itemId) {
            //Request
            this.$crud.show(propParams.apiRoute, this.itemId, params).then(response => {
              this.locale.form = this.$clone(response.data)
              resolve(true)
              this.loading = false//hide loading
            }).catch(error => {
              this.$alert.error({message: this.$tr('ui.message.errorRequest'), pos: 'bottom'})
              reject(false)
              this.loading = false//hide loading
            })
          }

          //Request if exist field
          if (this.params.field) {
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

              resolve(true)
              this.loading = false//hide loading
            }).catch(error => {
              this.$alert.error({message: this.$tr('ui.message.errorRequest'), pos: 'bottom'})
              reject(false)
              this.loading = false//hide loading
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
            this.$root.$emit(`crudForm${propParams.apiRoute}Created`)//emmit event
            this.$alert.info({message: `${this.$tr('ui.message.recordCreated')}`})
            this.initForm()
            this.loading = false
            this.show = false
            this.$emit('created', response.data)
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
          let criteria = this.itemId

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

        //Remove password if not allow update and is update
        if (this.itemId && !this.updatePassword) {
          delete data.password
        }

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

        return data//Response
      },
      //format slug
      setSlug(field) {
        setTimeout(() => {
          let slug = false
          let formTemplate = this.$clone(this.locale.formTemplate)//Get form template

          //If is creation and field is title or name
          if ((['title', 'name'].indexOf(field) != -1) && !this.itemId) {
            slug = formTemplate.name || formTemplate.title || false
          }

          //Format field slug
          if ((field == 'slug') && formTemplate.slug) slug = formTemplate.slug.replace(/-/g, ' ')

          //Set slug
          if (slug && (this.locale.formTemplate.slug != undefined))
            this.locale.formTemplate.slug = this.$clone(this.$helper.getSlug(slug))
        },100)
      },
      //validate if should show field
      showField(field, fieldName) {
        let response = true//Default response

        //Check if is password type and is updated record
        if (['password', 'checkPassword'].indexOf(field.type) != -1) {
          if (this.itemId && !this.updatePassword) response = false
        }

        //Check if is field "masterRecord" and check permission
        if (field.isFakeField && (fieldName == 'masterRecord')) {
          //Validate permission to create
          if (!this.itemId && !this.$store.getters['quserAuth/hasAccess']('isite.master.records.create')) {
            response = false
          }

          //Validate permission to update
          if (this.itemId && !this.$store.getters['quserAuth/hasAccess']('isite.master.records.edit')) {
            response = false
          }
        }

        //Response
        return response
      },
      //Validate password
      validateField(field) {

      }
    }
  }
</script>

<style lang="stylus">
  #modalFormCrud
    .q-card
      .q-card__section
        max-height calc(100vh - 148px) !important
        overflow-y scroll

    .modal-content
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
