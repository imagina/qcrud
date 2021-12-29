<template>
  <div id="crudComponent" v-if="crudData">
    <!--modal - form-->
    <master-modal v-if="allowSections.includes('modal-form')" v-model="sections.form.show"
                  custom-position :title="crudData.title" :loading="loading" :actions="sections.form.actions">
      <dynamic-form v-model="sections.form.data" :blocks="crudData.form.blocks" form-type="grid" no-actions
                    ref="formSection" @submit="updateRecord()"/>
    </master-modal>
  </div>
</template>
<script>
import form from '@imagina/qcrud/_components/v2/form'

export default {
  props: {
    module: {required: true},
    entity: {required: true},
    allowSections: {
      type: Array,
      default: () => {
        return ['modal-form']
      }
    }
  },
  components: {},
  watch: {},
  mounted() {
    this.$nextTick(function () {
      this.init()
    })
  },
  data() {
    return {
      loading: false,
      crudData: null,
      sections: {
        form: {
          show: false,
          recordId: null,
          data: {},
          actions: [
            {
              props: {
                label: this.$tr('ui.label.save'),
                color: 'green',
              },
              action: () => {
                if (this.$refs.formSection) this.$refs.formSection.changeStep('next', true)
              }
            }
          ]
        }
      }
    }
  },
  computed: {},
  methods: {
    init() {
      this.getData()
    },
    //Get data
    getData(refresh = false) {
      return new Promise((resolve, reject) => {
        this.loading = true
        //Requets params
        let requestParams = {
          refresh: true,
          params: {filter: {module: this.module, entity: this.entity}}
        }
        //Request
        this.$crud.index('apiRoutes.qsite.icruds', requestParams).then(response => {
          if (response.data.length) {
            this.crudData = response.data[0].projectCrud
            this.$emit('obtained', response.data[0])
          }
          this.loading = false
        }).catch(error => {
          this.loading = false
        })
      })
    },
    //Init update method
    initUpdate(id, params) {
      return new Promise((resolve, reject) => {
        if (!id) return reject('id parameter is required')//Validate
        this.sections.form.show = true//Open modal section from
        this.sections.form.recordId = id//Open modal section from
        this.loading = true//kinit loading

        //Request params
        let requestParams = {
          refresh: true,
          params: {...params, filter: {...(params.filter || {}), allTranslations: true}}
        }
        //Request to get item to update
        this.$crud.show(this.crudData.apiRoute, id, requestParams).then(response => {
          this.sections.form.data = this.$clone(response.data)
          this.loading = false
        })
      })
    },
    //Update record
    updateRecord() {
      return new Promise((resolve, reject) => {
        this.loading = true
        //Request data
        let requestData = this.$clone(this.sections.form.data)
        //Request
        this.$crud.update(this.crudData.apiRoute, this.sections.form.recordId, requestData).then(response => {
          this.$alert.success({message: `${this.$tr('ui.message.recordUpdated')}`})
          this.sections.form.show = false
          this.loading = false
          resolve(true)
        }).catch(error => {
          this.$alert.error({message: this.$tr('ui.message.recordNoUpdated')})
          this.loading = false
          reject(error)
        })
      })
    }
  }
}
</script>
<style lang="stylus">
</style>
