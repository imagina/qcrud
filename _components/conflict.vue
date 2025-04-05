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
    this.setInfo()
    if(!newValue){
      this.$emit('closeModal')
    }
  }, 
  data(newValue){
    this.data = newValue
    this.setItem()
    this.setInfo()
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
  itemIsDeleted(){
    return this.item['deletedAt'] == null ? false : true
  }
},
methods: {
  setInfo(){
    if(this.itemIsDeleted){
      this.info.props.message = this.$tr('isite.cms.label.conflict.deletedMessage')
    } else {
      this.info.props.message = this.$tr('isite.cms.label.conflict.duplicatedMessage')
    }
  },
  setItem(){
    this.item = {...this.data.data[0]}
  }, 
  conflictHandler(){    
    //if item has softdelete    
    if(this.itemIsDeleted){      
      this.gotoRecycleBin()      
    } else {
      this.gotoUpdateItem()      
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
