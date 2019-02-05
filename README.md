##Module Qcrud
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
In each module directory `/_components` create `/crud` directory and copy base configuration file from 
`@imagina/vcrud/_components/crud/configuration.js`  
rename with the crud name that you are going to implement like:
 `@imagina/vcrud/_components/crud/yourCrudConfig.js`


####Routes 

In your master proyect `src/router` create file `crudRoutes`:
```js
import Route from 'vue-routisan'
import auth from '@imagina/quser/_router/middlewares/auth' //Middleware auth
import access from '@imagina/quser/_router/middlewares/access' //Middleware access

/*YOUR MASTER LAYOUT*/
import home from 'src/layouts/master'

import vueCrud from '@imagina/qcrud/_components/vueCrud'

/*CRUD TAX RATES CONFIGURATIONS*/
import * as yourCrudConfig from 'src/components/crud/yourCrudConfig'

/*CRUD ROUTES*/
Route.view('/masterLayoutRoute', home)
  .guard(auth)
  .children(() => {
    Route.view('/yourCrudRoute', vueCrud).options({
      name: 'route.name',
      meta: {permission: 'permission.for.this.route'},
      guard: access,
      props: (route) => {
        return {
          storeName: 'storage.name.for.broadcast.clear.cache', //config.name for services
          singularName: 'singular name',
          pluralName: 'plural name',
          parentId: route.params.parentId || null, ...yourCrudConfig,
          doPage: false
        }
      },
    })
  
  })

export default Route.all()

```

In `src/router/routes.js` add:
```js
import crudRoutes from './crudRoutes' //Routes Crud
```