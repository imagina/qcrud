<template>
  <div class="crudContentPage">
    <!--Dynamic component to get crud data-->
    <div v-if="componentCrudData" :is="componentCrudData" ref="componentCrudData"></div>
    <!--Button Create-->
    <q-btn class="btnCreateCrud" icon="fas fa-plus" color="positive" :label="`${params.create.title || ''}`"
           @click="indexEmmitCreate" v-if="justCreate && params.create && hasPermission.create" size="sm"/>
    <!--Crud-->
    <div v-if="success">
      <!--Index component-->
      <crud-index v-if="params.read && !justCreate" :params="$clone(paramsProps)" ref="crudIndex"
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
      crudData: { default: false },//import of vue with computed
      justCreate: { type: Boolean, default: false }
    },
    components: { crudIndex, crudForm },
    watch: {},
    validations () {
      return {}
    },
    mounted () {
      this.$nextTick(async function () {
        this.init()
      })
    },
    data () {
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
        itemIdToEdit: false//item ID to edit
      }
    },
    computed: {
      //Return has permission
      hasPermission () {
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
      async init () {
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
            }, 100)
          }).catch(error => {})
        }
      },
      //watch emit create from index component
      indexEmmitCreate () {
        this.itemIdToEdit = false
        this.fieldData = false
        this.showModal = true
      },
      //watch emit update from index component
      indexEmmitUpdate (params) {
        this.itemIdToEdit = params.id
        if (this.params.field) this.fieldData = params
        this.showModal = true
      },
      //watch emit update from form component
      formEmmit (type = 'created') {
        if (this.params.read && !this.justCreate) {
          this.$refs.crudIndex.getDataTable(true)
        }
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
