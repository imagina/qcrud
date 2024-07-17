<template>
  <div>
    <master-modal 
      v-model="showModal"      
      :title="this.$tr('isite.cms.label.registerId', {id: item.id})"
    >
      <div>
        <dynamic-field :field="this.restore" v-if="canRestore"/> 
        <dynamic-field :field="this.delete" v-if="canDelete"/> 
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
    <dynamic-field :field="info" />
  </div>
</template>
<script>

export default {
props: {
  value: {default: false},
  item: {}
},
watch: {
  value(newValue) {    
    this.showModal = newValue
  }, 
  showModal(newValue){
    if(!newValue){
      this.$emit('closeModal')
    }
  } 
},
data() {
  return {    
    showModal: this.value,
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
              this.$emit('restore', this.item)
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
              this.$emit('delete', this.item)
            }
          }
        ]
      }
    },   
  }
},
computed: {
  itemLabel(){    
    return this.item ? this.item.name || this.item.title || this.item.userName || this.item.first_name || '' : ''
  },
  canRestore(){
    return !this.$store.getters['quserAuth/hasAccess']('isite.soft-delete.restore')
  }, 
  canDelete(){
    return !this.$store.getters['quserAuth/hasAccess']('isite.soft-delete.delete')
  }
}, 
methods: {}  
}
</script>
