<template>
  <div>
    <master-modal 
      v-model="showModal"
      :title="`${this.itemLabel}`" 
    >
      <div>
        <p v-if="item" class="q-my-md">
          Register: {{ item.id }} - {{ itemLabel }}
        </p>
        <dynamic-field :field="this.restore" /> 
        <dynamic-field :field="this.delete" /> 
      </div>
      <q-separator />
      <div class="row justify-center q-gutter-md q-my-sm">
        <q-btn 
          unelevated 
          rounded 
          label="Cancel" 
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
 showModal: false 
}, 
data() {
  return {
    crudId: this.$uid(),    
    item: null,    
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
                console.log('restore the item')
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
              this.deletePermanently({})
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
}, 
methods: {
  init(){

  },
  deletePermanently(item) {
    this.$alert.error({
      mode: 'modal',
      //title: `ID: ${item.id}`,
      message: this.$tr('isite.cms.message.deleteRecord'),
      actions: [
        {label: this.$tr('isite.cms.label.cancel'), color: 'grey'},
        {
          label: this.$tr('isite.cms.label.delete'),
          color: 'red',
          handler: () => {
            //Request
            console.log('delete permanently')
          }
        }
      ]
    })
  },      
}  
}
</script>
