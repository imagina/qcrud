<template>
  <div>
    <master-modal 
      v-model="showModal"      
      :title="this.$tr('isite.cms.label.registerId', {id: item.id})"    >
      <div>
        <dynamic-field :field="info" />
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
          @click="$emit('closeModal')"
        />
      </div>

    </master-modal>    
    <!-- banner info -->
    
  </div>
</template>
<script>

export default {
props: {
  value: {default: false},
  data: {}
  
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
  data(newValue){
    this.data = newValue
    this.setInfo()
    this.setItem()
  }
},
data() {
  return {    
    showModal: this.value,
    item: {},
    info: {
      type: 'banner',
      props: {
        color: 'negative',
        icon: 'fas fa-exclamation-triangle',
        message: '', 
        actions: [
          {
            props: {
              label: this.$tr('isite.cms.label.solveConflict'),
              color: 'green'
            },
            action: () => {
              this.conflictHandler()
            }
          }
        ]
      }      
    },
  }
},
computed: {
}, 
methods: {
  setInfo(){
    this.info.props.message = this.data?.messages ? this.data.messages[0].message : ''
  },
  setItem(){
    this.item = {...this.data.data[0]}
  }, 
  conflictHandler(){    
    //if item has softdelete
    if(this.item['deletedAt'] == null){      
      this.gotoUpdateItem()
    } else {
      this.gotoRecycleBin()
    }
  },
  gotoUpdateItem(){
    const paramsUrl = {['edit']: this.item.id }    
    this.openTab(paramsUrl)
  },
  gotoRecycleBin(){
    const paramsUrl = {['recycle-bin']: true, ['recycle-bin-manage']: this.item.id}
    this.openTab(paramsUrl)    
  }, 
  openTab(paramsUrl){
    const routeData = this.$router.resolve({name: this.$route.name, query: paramsUrl});
    window.open(routeData.href, '_blank');
  }
}
}
</script>
