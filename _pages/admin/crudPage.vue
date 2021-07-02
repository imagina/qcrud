<template>
  <div id="crudPage" :key="pageId">
    <!---Component CRUD-->
    <crud v-if="crudData" :crud-data="crudData" ref="crudComponent" :custom-data="customData"
          :title="$tr($route.meta.title)"/>
  </div>
</template>
<script>
export default {
  props: {},
  components: {},
  watch: {
    '$route': {
      deep: true,
      handler: function () {
        this.init()
      }
    }
  },
  validations() {
    return {}
  },
  mounted() {
    this.$nextTick(function () {
      this.init()
    })
  },
  data() {
    return {
      pageId: this.$uid(),
      crudData: false,
      customData: {
        mobileAction: true
      }
    }
  },
  methods: {
    init() {
      //Reset page ID
      this.pageId = this.$uid()
      //Set crud data
      this.crudData = this.$route.meta.crud || false
      //Handle edit and create url action
      this.handlerUrlCrudAction()
    },
    handlerUrlCrudAction() {
      setTimeout(() => {
        let urlQuery = this.$route.query
        if (urlQuery.edit) this.$refs.crudComponent.update({id: urlQuery.edit})
        if (urlQuery.create) this.$refs.crudComponent.create()
      }, 500)
    }
  }
}
</script>
<style lang="stylus">
</style>
