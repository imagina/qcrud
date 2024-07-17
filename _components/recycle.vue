<template>
  <div>
    <master-modal 
      v-model="showModal"
      :title="`Restore or Delete ID: ${item.id}`"
    >
      <div>
        <p v-if="item" class="q-my-md">
          Register: {{ item.id }} - {{ itemLabel }}
        </p>
        <dynamic-field :field="this.restore" v-if="canRestore"/> 
        <dynamic-field :field="this.delete" v-if="canDelete"/> 
      </div>
      <q-separator />
      <div class="row justify-center q-gutter-md q-my-sm">
        <q-btn 
          unelevated 
          rounded 
          :label="this.$tr('isite.cms.label.restore')" 
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
        message: 'This is the recycle bin, When you delete a register, it goes to this Recycle Bin as a temporary file. You can restore It or delete It permanently from its options.',        
      }
    },    
    restore: {
      title: 'Restore register',
      type: 'banner',
      props: {
        color: 'green',
        icon: 'fas fa-exclamation-triangle',
        message: 'Do you want to restore this register?, this action will move the register to its original table',
        actions: [
          {
            props: {
              label: 'Restore this register',
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
      title: 'Delete Permanently',
      type: 'banner',
      props: {
        color: 'negative',
        icon: 'fas fa-exclamation-triangle',
        message: 'Do you want to delete Permanently this register?, Once you delete this register, there is no going back. Please be certain.',
        actions: [          
          {
            props: {
              label: 'Delete this register permanently',
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
    return this.$store.getters['quserAuth/hasAccess']('isite.soft-delete.restore')
  }, 
  canDelete(){
    return this.$store.getters['quserAuth/hasAccess']('isite.soft-delete.delete')
  }
}, 
methods: {}  
}
</script>
