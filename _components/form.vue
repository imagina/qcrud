<template>
  <!--Modal with form to category-->
  <q-modal id="modalFormCrud" v-model="show" v-if="show"
           no-esc-dismiss no-backdrop-dismiss class="backend-page">
    <q-modal-layout :class="`${existFormRight ? 'col-2' : 'col-1'}`">
      <!--Header-->
      <q-toolbar slot="header">
        <q-toolbar-title v-if="!itemId">{{params.create.title}}</q-toolbar-title>
        <q-toolbar-title v-else>{{params.update.title}} ID: {{itemId}}</q-toolbar-title>
        <q-btn flat v-close-overlay icon="fas fa-times"/>
      </q-toolbar>

      <!--Footer-->
      <q-toolbar slot="footer" color="white">
        <q-toolbar-title></q-toolbar-title>
        <!--Button Save-->
        <q-btn icon="fas fa-save" color="positive"
               v-if="!itemId" :label="$tr('ui.label.save')"
               :loading="loading" @click="createItem()"/>
        <!--Button Update-->
        <q-btn :label="$tr('ui.label.update')" icon="fas fa-pen" color="positive"
               :loading="loading" @click="updateItem()" v-else/>
      </q-toolbar>

      <!--Content-->
      <div class="layout-padding relative-position" v-if="success">
        <!--Forms-->
        <div class="row gutter-x-md">
          <!--Language-->
          <div class="col-12"
               v-show="locale.fieldsTranslatable && Object.keys(locale.fieldsTranslatable).length">
            <locales v-model="locale" ref="localeComponent" @validate="$v.$touch()"/>
          </div>
          <!--Form-->
          <div v-for="(pos,key) in ['formLeft','formRight']" :key="pos"
               :class="`col-12 ${existFormRight ? ((pos=='formLeft') ? 'col-md-7' : 'col-md-5') : ''}`"
               v-if="locale.success">
            <!--Fields-->
            <div v-for="(field, key) in  params[pos]" :key="key" :ref="key">
              <!--Field-->
              <q-field :error="field.isRequired ? $v.locale.formTemplate[field.name || key].$error : false"
                       :error-label="getValidationMessage(field.type)">
                <!--Toogle password-->
                <q-checkbox v-if="itemId && (field.type == 'password')" class="q-mt-sm"
                            v-model="updatePassword" :label="$tr('ui.message.updatePassword')"/>
                <!--Dynamic field to options-->
                <dynamic-field v-model="locale.formTemplate.options[field.name || key]" :key="key"
                               @input="setSlug(field.name || key)" :field="field"
                               :language="locale.language" :item-id="itemId"
                               v-if="showField(field, (field.name || key)) && field.isFakeField"
                               @enter="itemId ? updateItem() : createItem()"/>
                <!--Dynamic field-->
                <dynamic-field v-model="locale.formTemplate[field.name || key]" :key="key"
                               @input="setSlug(field.name || key)" :field="field"
                               :language="locale.language" :item-id="itemId"
                               v-if="showField(field, (field.name || key)) && !field.isFakeField"
                               @enter="itemId ? updateItem() : createItem()"/>
              </q-field>
            </div>
          </div>
        </div>

        <!--Loading-->
        <inner-loading :visible="loading"/>
      </div>
    </q-modal-layout>
  </q-modal>
</template>

<script>
  //Components
  import Treeselect from '@riophae/vue-treeselect'
  import '@riophae/vue-treeselect/dist/vue-treeselect.css'
  import uploadImg from '@imagina/qmedia/_components/form'
  import locales from '@imagina/qsite/_components/locales'
  import recursiveSelect from 'src/components/master/recursiveListSelect'
  //Plugins
  import {required, requiredIf, sameAs, email} from 'vuelidate/lib/validators'
  import _cloneDeep from 'lodash.clonedeep'

  export default {
    props: {
      value: {default: false},
      itemId: {default: false},
      params: {default: false}
    },
    components: {
      recursiveSelect, uploadImg,
      Treeselect, locales
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
    validations() {
      return this.getObjectValidation()
    },
    data() {
      return {
        success: false,//global component status
        show: false,
        locale: {fields: {options: {}}, fieldsTranslatable: {}, validations: {}},
        loading: false,
        updatePassword: false//Permit edit password
      }
    },
    computed: {
      //Check if exist from right
      existFormRight() {
        if (this.params.formRight && Object.keys(this.params.formRight).length)
          return true
        else return false
      },
    },
    methods: {
      //Init form
      async initForm() {
        this.orderFields()//order fields to component locale
        this.$v.$reset()//Reset validations
        this.show = this.value//Assign props value to show modal
        this.success = true//succesfull
        if (this.itemId) await this.getDataItem()//Get data item
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
          if (field.isTranslatable) fieldsTranslatables[field.name || key] = field.value
          else if (field.isFakeField) fields.options[field.name || key] = field.value
          else fields[field.name || key] = field.value
          //Create validations
          if (field.isRequired)
            validations[field.name || key] = this.getValidationByFieldType(field.type)//Set validations
        })

        //Assign fields and valitadions to locale
        this.locale.fields = this.$clone(fields)
        this.locale.fieldsTranslatable = this.$clone(fieldsTranslatables)
        this.locale.validations = this.$clone(validations)
      },
      //Return validations by field type
      getValidationByFieldType(type) {
        let response = {required}//Default validation

        switch (type) {
          case 'email'://=== Password
            response = {required, email}
            break;
          case 'password'://=== Password
            response = {
              required: requiredIf(() => {
                return this.itemId ? (this.updatePassword ? true : false) : true
              })
            }
            break;
          case 'checkPassword'://=== Check Password
            response = {
              required: requiredIf(() => {
                return this.itemId ? (this.updatePassword ? true : false) : true
              }),
              sameAs: sameAs('password')
            }
            break;
        }

        return response//Response
      },
      //Return message validation by field type
      getValidationMessage(type) {
        let response = this.$tr('ui.message.fieldRequired')//Default message

        switch (type) {
          case 'email'://=== Check Password
            response = this.$tr('ui.message.fieldEmail')
            break;
          case 'checkPassword'://=== Check Password
            response = this.$tr('ui.message.fieldCheckPassword')
            break;
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

          //Request
          this.$crud.show(propParams.apiRoute, this.itemId, params).then(response => {
            this.locale.form = _cloneDeep(response.data)
            resolve(true)
            this.loading = false//hide loading
          }).catch(error => {
            this.$alert.error({message: this.$tr('ui.message.errorRequest'), pos: 'bottom'})
            reject(false)
            this.loading = false//hide loading
          })
        })
      },
      //Create Category
      createItem() {
        this.$refs.localeComponent.vTouch()//Validate component locales
        //Check validations
        if (!this.$v.$error) {
          this.loading = true
          let propParams = this.$clone(this.params)

          this.$crud.create(propParams.apiRoute, this.getDataForm()).then(response => {
            this.$root.$emit(`crudForm${propParams.apiRoute}Created`)//emmit event
            this.$alert.success({message: `${this.$tr('ui.message.recordCreated')}`})
            this.initForm()
            this.loading = false
            this.show = false
            this.$emit('created', response.data)
          }).catch(error => {
            this.$alert.error({message: `${this.$tr('ui.message.recordNoCreated')}`})
            this.loading = false//login hide
            if (error) {//Message Validate
              let errorMsg = JSON.parse(error)
              if (errorMsg.email)
                this.$alert.error({
                  message: this.$tr('quser.layout.message.emailExist'),
                  pos: 'bottom', timeOut: 4000
                })
              else this.$alert.error({message: `${this.$tr('ui.message.recordNoCreated')}`})
            }
          })
        } else {
          this.$alert.error({message: this.$tr('ui.message.formInvalid'), pos: 'bottom'})
        }
      },
      //Update Category
      updateItem() {
        this.$refs.localeComponent.vTouch()//Validate component locales
        //Check validations
        if (!this.$v.$error) {
          this.loading = true
          let propParams = this.$clone(this.params)

          this.$crud.update(propParams.apiRoute, this.itemId, this.getDataForm()).then(response => {
            this.$root.$emit(`crudForm${propParams.apiRoute}Updated`)//emmit event
            this.$alert.success({message: this.$tr('ui.message.recordUpdated')})
            this.initForm()
            this.loading = false
            this.show = false
            this.$emit('updated', response.data)
          }).catch(error => {
            this.loading = false
            this.$alert.error({message: this.$tr('ui.message.recordNoUpdated')})
          })
        } else {
          this.$alert.error({message: this.$tr('ui.message.formInvalid'), pos: 'bottom'})
        }
      },
      //Return data of form
      getDataForm() {
        //Clone data form
        let data = this.$clone(this.locale.form)

        //Remove password if not allow update and is update
        if (this.itemId && !this.updatePassword)
          delete data.password

        return data//Response
      },
      //Return object to validations
      getObjectValidation() {
        let response = {}
        if (this.locale && this.locale.formValidations)
          response = {locale: this.locale.formValidations}
        return response
      },
      //Complete slug Only when is creation
      setSlug(field) {
        if ((['title', 'name'].indexOf(field) != -1) && !this.itemId) {
          let formTemplate = this.$clone(this.locale.formTemplate)//Get form template
          let keys = Object.keys(this.locale.formTemplate)//Get field keys

          //Get title or name, if exist field slug
          if (keys.indexOf('slug') != -1) {
            let title = ''
            //Get title or name
            if ((keys.indexOf('name') != -1) && formTemplate.name) title = formTemplate.name.trim()
            if ((keys.indexOf('title') != -1) && formTemplate.title) title = formTemplate.title.trim()
            //Get slug
            let slug = this.$clone(title.split(' ').join('-').toLowerCase())
            //Set slug as title
            this.locale.formTemplate.slug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          }
        }
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
          if(!this.itemId && !this.$auth.hasAccess('isite.master.records.create'))
            response = false

          //Validate permission to update
          if(this.itemId && !this.$auth.hasAccess('isite.master.records.edit'))
            response = false
        }

        //Response
        return response
      }
    }
  }
</script>

<style lang="stylus">
  @import "~variables";
  #modalFormCrud
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
