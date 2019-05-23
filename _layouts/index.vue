<template>
	<q-page class="relative-position">
		
		<!--======================== LOADING ======================-->
		<!--Inner loading-->
		<inner-loading :visible="loading" />
		
		<q-page-container>
			<router-view :key="$route.fullPath"></router-view>
			<q-ajax-bar/>
		</q-page-container>
	</q-page>
</template>

<script>
	//components
	import innerLoading from 'src/components/master/innerLoading'

  export default {
		components : {
			innerLoading
		},
    data () {
      return {
        loading:false,
        selectedLocale: 'EN',
        locales: [
          'EN', 'ID'
        ],
        drawer: false,
        menuItems: [
          { icon: 'settings', title: 'Example Form', link: '/example-form' },
          {
            icon: 'keyboard_arrow_up',
            'icon-alt': 'keyboard_arrow_down',
            title: 'Crud',
            model: true,
            children: [
              { icon: 'home', title: 'Party', link: '/party' },
              { icon: 'create', title: 'Party Inline', link: '/party-inline' },
              { icon: 'list_alt', title: 'Notes', link: '/notes' },
              { icon: 'announcement', title: 'Notes2', link: '/notes2' }
            ]
          }
        ]
      }
    },
    created () {
      if (this.$i18n) this.$i18n.locale = this.selectedLocale.toLowerCase()
    },
    methods: {

    }
  }
</script>
