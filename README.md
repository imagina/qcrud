##Module Vcrud
A VueJS CRUD component which is customisable and extensible to suit more complex situations such as Nested CRUD, custom filters, custom form custom actions. Views Based in Quasar Framework.

##Requiered
####Plugins
- helper
- vuelidate
- axios
- date-fns
- export-from-json
- @imagina/quser/_plugins/auth
- lodash.clonedeep
- lodash.pick
##Usage

####Configuration 
In each module directory `/_components` add: `/crud/configuration.js`
 
 see `@imagina/vcrud/_components/crud/configuration.js` 

####Routes 

In each module file `/_router/routes` add:
```js
import vueCrud from '@imagina/vcrud/_components/vueCrud'

/*CRUD CONFIGURATIONS*/
import * as configuration from '../_components/crud/configuration'

Route.view('/example', vueCrud).options({
      name: 'alias',
      meta: {permission: 'permission.to.this.route'},
      guard: access,
      props: (route) => { return { storeName: 'examples', singularName:'example', parentId: route.params.parentId || null, ...configuration, doPage: false } },
    })
```
