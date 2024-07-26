<template>
  <div>
    <master-modal 
      v-model="showModal"      
      :title="this.$tr('isite.cms.label.registerId', {id: itemData.id})"
    >
      <div>
        <dynamic-field :field="this.restore" v-if="canRestore"/> 
        <dynamic-field :field="this.delete" v-if="canDestroy"/> 
      </div>
      <q-separator />
      <div class="row justify-end q-gutter-md q-my-sm">
        <q-btn 
          unelevated 
          rounded 
          :label="this.$tr('isite.cms.label.cancel')" 
          color="grey-4"
          textColor="black"
          no-caps
          size="md"
          @click="closeModal()"
        />
      </div>

    </master-modal>    
    <!-- banner info -->
    <dynamic-field :field="info" v-if="isRecyleCrud" />
  </div>
</template>
<script>

export default {
props: {
  value: {default: false},
  item: { 
    required: false,
    type: Object, 
    default: () => {
      return {
        id: null
      }
    }
  }
},
watch: {
  value(newValue) {    
    this.showModal = newValue
  }, 
  showModal(newValue){
    if(!newValue){
      this.$emit('closeModal')
    }
  }, 
  item(newValue){
    this.itemData = newValue
  }
 
},
mounted(){
  this.init()
},
data() {
  return {    
    showModal: this.value,
    itemData: this.item,
    info: {
      type: 'banner',
      props: {
        color: 'info',
        icon: 'fas fa-exclamation-triangle',
        message: this.$tr('isite.cms.label.recycleBin.infoMessage')
      }
    },    
    restore: {
      type: 'banner',
      props: {
        color: 'green',
        icon: 'fas fa-exclamation-triangle',
        message: this.$tr('isite.cms.label.recycleBin.restoreMessage'),
        actions: [
          {
            props: {
              label: this.$tr('isite.cms.label.recycleBin.restoreLabel'),
              color: 'green'
            },
            action: () => {
              this.$emit('restore', this.itemData)
            }
          }
        ]
      }
    },
    delete: {
      type: 'banner',
      props: {
        color: 'negative',
        icon: 'fas fa-exclamation-triangle',
        message: this.$tr('isite.cms.label.recycleBin.deleteMessage'),
        actions: [          
          {
            props: {
              label: this.$tr('isite.cms.label.recycleBin.deleteLabel'),
              color: 'negative'
            },
            action: () => {                             
              this.$emit('delete', this.itemData)
            }
          }
        ]
      }
    },   
  }
},
computed: {
  isRecyleCrud(){
    const permission = this.$store.getters['quserAuth/hasAccess']('isite.soft-delete.index') || false
    const query = this.getUrlParams()
    let response = false

    if(query['recycle-bin']){
      if(permission){
        response = query['recycle-bin'] ? (query['recycle-bin'] == 'true') : false
      } else {
        /*remove recycle-bin from url queries*/
        const newQueryParams = {...this.$route.query}
        delete newQueryParams['recycle-bin']
        delete newQueryParams['recycle-bin-manage']
        this.$router.replace({ query: newQueryParams });
      }
    }
    return response
  },
  canRestore(){
    return this.$store.getters['quserAuth/hasAccess']('isite.soft-delete.restore') || false
  }, 
  canDestroy(){
    return this.$store.getters['quserAuth/hasAccess']('isite.soft-delete.destroy') || false
  }
}, 
methods: {
  init(){    
    this.openModal();   
  },
  openModal(){
    const query = this.getUrlParams()
    if(query['recycle-bin-manage']){
      this.showModal = true
      this.itemData = {id: query['recycle-bin-manage']}
    }
  },
  closeModal(){
    this.showModal = false
    this.$emit('closeModal')
  },
  getUrlParams(){
    const params = decodeURI(window.location).split('?')
    if(Array.isArray(params) ){
      if(params.length > 1){
        const query =  params[1]
          .split('&')
          .map(param => param.split('='))
          .reduce((values, [ key, value ]) => {
            values[ key ] = value
            return values
        }, {})
        return query
      }          
    }
    return {}
  },
}  
}
</script>
