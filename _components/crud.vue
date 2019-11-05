<template>
  <div class="crudContentPage">
    <!--=== Dynamic component to get crud data ===-->
    <div v-if="componentCrudData" :is="componentCrudData" ref="componentCrudData"></div>

    <!--=== Button to Create ===-->
    <q-btn class="btnCreateCrud" icon="fas fa-plus" color="positive" :label="`${params.create.title || ''}`"
           @click="indexEmmitCreate" v-if="justCreate && params.create && hasPermission.create" size="sm"/>

    <!--=== Select to List and Create ===-->
    <q-select v-model="dataCrudSelect.itemSelected" :options="dataCrudSelect.options"
              :loading="dataCrudSelect.loading" :label="`${label || params.create.title}`"
              style="width: 100%;" v-if="crudSelect && params.create && hasPermission.create"
              @filter="filterOptions" @input="$emit('input', dataCrudSelect.itemSelected.value)"
              outlined dense use-input map-options>
      <!--Before options slot-->
      <template v-slot:before-options>
        <q-btn class="btnCreateCrud full-width" flat icon="fas fa-plus" color="positive"
               :label="`${params.create.title || ''}`" @click="indexEmmitCreate"/>
      </template>
      <!--No options slot-->
      <template v-slot:no-option>
        <q-btn class="btnCreateCrud full-width" flat icon="fas fa-plus" color="positive"
               :label="`${params.create.title || ''}`" @click="indexEmmitCreate"/>
        <q-item>
          <q-item-section class="text-grey">
            {{$tr('ui.message.notFound')}}
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <!--=== Full Crud ===-->
    <div v-if="success">
      <!--Index component-->
      <crud-index v-if="params.read && !justCreate && !crudSelect" :params="$clone(paramsProps)" ref="crudIndex"
                  @create="indexEmmitCreate" @update="indexEmmitUpdate"/>
      <!--Modal create/update component-->
      <crud-form v-model="showModal" v-if="(params.create || params.update) && showModal"
                 :params="$clone(paramsProps)" :item-id="itemIdToEdit" :field="fieldData"
                 @created="formEmmit()" @updated="formEmmit('updated')"/>
    </div>
  </div>
</template>
<script>
  //Component
  import crudIndex from '@imagina/qcrud/_components/index'
  import crudForm from '@imagina/qcrud/_components/form'

  export default {
    props: {
      crudData: {default: false},//import of vue with computed
      justCreate: {type: Boolean, default: false},
      crudSelect: {type: Boolean, default: false},
      label: {default: false},
    },
    components: {crudIndex, crudForm},
    watch: {},
    validations() {
      return {}
    },
    mounted() {
      this.$nextTick(async function () {
        this.init()
      })
    },
    data() {
      return {
        componentCrudData: false,//To get crud data from computed
        params: false,
        success: false,//Global status of component
        loading: true,//Loading
        paramsProps: {},
        message: {
          requiredApiRoute: false,
        },
        showModal: false,//vmodel modal
        fieldData: false,//Field data
        itemIdToEdit: false,//item ID to edit
        dataCrudSelect: {
          loading: false,
          itemSelected: null,//Item to emmit if is crudSelect
          options: [],//options to show in select
          rootOptions: [],//Save all options
        }
      }
    },
    computed: {
      //Return has permission
      hasPermission() {
        let params = this.$clone(this.params)
        return {
          create: params.permission ? this.$auth.hasAccess(`${params.permission}.create`) : true,
          edit: params.permission ? this.$auth.hasAccess(`${params.permission}.edit`) : true,
          destroy: params.permission ? this.$auth.hasAccess(`${params.permission}.destroy`) : true,
        }
      }
    },
    methods: {
      //init form
      async init() {
        if (this.crudData) {
          //Get crudData
          this.crudData.then((response) => {
            this.componentCrudData = response.default//asign component
            setTimeout(() => {
              //asing crudData to params
              this.params = this.$refs.componentCrudData.crudData
              //check global params
              this.paramsProps = this.$clone(this.params)
              this.paramsProps.hasPermission = this.hasPermission//Add permission validated
              this.success = true//udate success
              this.loading = false //hidden Loading
              this.getIndexOptions()//Get indexOptions if is crudSelect
            }, 100)
          }).catch(error => {
          })
        }
      },
      //Return options if is crudSelect
      getIndexOptions() {
        if (!this.crudSelect) return false
        this.dataCrudSelect.loading = true
        let params = this.$clone(this.paramsProps)
        let responseOptions = []//Default Value

        //Order params to request
        let requestParams = {
          refresh: true,
          params: params.read.requestParams || {}
        }

        //Request to get data
        this.$crud.index(params.apiRoute, requestParams).then(response => {
          //Set all items to response
          response.data.forEach(item => {
            responseOptions.push({label: item.fullName, value: item.id})
          })
          this.dataCrudSelect.loading = false
        }).catch(error => this.dataCrudSelect.loading = false)

        //Set options
        this.dataCrudSelect.rootOptions = responseOptions
        this.dataCrudSelect.options = responseOptions
      },
      //Filter options when is crudSelect
      filterOptions(val, update, abort) {
        update(() => {
          let rootOptions = this.dataCrudSelect.rootOptions
          let responseOptions = []

          //Search params
          for (let opt of rootOptions) {
            if (opt.value.toString().toLowerCase().indexOf(val.toLowerCase()) > -1)
              responseOptions.push(opt)
            else if (opt.label.toLowerCase().indexOf(val.toLowerCase()) > -1)
              responseOptions.push(opt)
          }

          //Set options
          this.dataCrudSelect.options = this.$clone(responseOptions)
        })
      },
      //watch emit create from index component
      indexEmmitCreate() {
        this.itemIdToEdit = false
        this.fieldData = false
        this.showModal = true
      },
      //watch emit update from index component
      indexEmmitUpdate(params) {
        this.itemIdToEdit = params.id
        if (this.params.field) this.fieldData = params
        this.showModal = true
      },
      //watch emit update from form component
      formEmmit(type = 'created') {
        if (this.params.read && !this.justCreate && !this.crudSelect) {
          this.$refs.crudIndex.getDataTable(true)
        } else this.getIndexOptions()
        this.$emit(type)
      },
    }
  }
</script>
<style lang="stylus">
  .btnCreateCrud
    padding 3px 8px

    .q-icon
      margin-right 5px
      font-size 12px

    .q-btn__content
      font-size 12px
</style>
