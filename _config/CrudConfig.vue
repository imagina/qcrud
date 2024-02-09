<template></template>
<script>
export default {
  name: "configCrud",
  data() {
    return {
      crud: {},
      refs: null,
      color: null,
      defaultFilter: null,
      modal: null,
      appMode: null
    }
  },
  methods: {
    getData(data, refs, defaultFilter, color, modal, appMode) {
      this.crud = data
      this.refs = refs
      this.appMode = appMode
      this.modal = modal
      this.defaultFilter = defaultFilter
      this.color = color
      for (let key in data) {
        if (key === "create") {
          if (data[key]) {
            this.create(data[key], key)
          }
        }
        if (key === "read") {
          if (data[key]) {
            this.getRead(data[key])
          }
        }
        if (key === "update") {
          if (data[key]) {
            this.update(data[key])
          }
        }
        if (key === "delete") {
          if (typeof(data[key]) === "object") {
            this.delete(data[key])
          }
        }
      }
      return this.crud
    },
    create(data, root) {
      for (let key in data) {
        if (key === "title") {
          this.crud[root]["title"] = this.$tr(data.title)
        }
        if (key === "toExternalUrl") {
          if (typeof(data[key]) === "object") {
            data[key] = `${this.$store.state.qsiteApp[data[key]["domine"]]}${[
              data[key]["path"],
            ]}`
          }
        }
        if (key === "validatioAppMode") {
          if (config("app.mode") === data[key]["mode"]) {
            this.crud["create"] = {
              method: () => {
                this.refs[data[key]["ref"]["name"]][data[key]["ref"]["method"]](
                  {
                    modalProps: {
                      title: this.$tr(data[key]["modalProps"]["title"]),
                    },
                  }
                )
              },
            }
          }
        }
      }
    },
    delete(updateObj) {
      this.crud["update"] = updateObj
      for (let update in updateObj) {
        if (update === "title") {
          const titleObj = updateObj[update]
          if (typeof(titleObj) === "object") {
            if (titleObj["isTranslatable"]["type"] === "singular") {
              this.crud["update"][update] = this.$tr(
                titleObj["isTranslatable"]["value"]
              )
            }
          }
        }
      }
    },
    update(updateObj) {
      this.crud["update"] = updateObj
      for (let update in updateObj) {
        if (update === "title") {
          const titleObj = updateObj[update]
          if (typeof(titleObj) === "object") {
            if (titleObj["isTranslatable"]["type"] === "singular") {
              this.crud["update"][update] = this.$tr(
                titleObj["isTranslatable"]["value"]
              )
            }
          }
        }
        if (update === "requestParams") {
          const paramsObj = updateObj[update]
          for (let key in paramsObj) {
            if (key === "filter") {
              this.filtersParams(update, key, "read")
            }
          }
        }
      }
    },
    getRead(readObj) {
      this.crud["read"] = readObj
      for (let read in readObj) {
        if (read === "filters") {
          this.crud["read"][read] = {}
          //this.filters(readObj[read])
        }
        if (read === "showAs") {
          this.crud.read[read] = this.setShowAs(readObj[read])
        }
        if (read === "columns") {
          this.colunms(readObj[read])
        }
        if (read === "actions") {
          this.actions(readObj[read])
        }
        if (read === "grid") {
          //this.grid(readObj[read], 'grid')
        }
        if (read === "requestParams") {
          const paramsObj = readObj[read]
          for (let key in paramsObj) {
            if (key === "filter") {
              this.filtersParams(read, key, "update", paramsObj)
            }
          }
        }
      }
    },
    colunms(columns) {
      columns.map((item) => {
        if (typeof( item.label) === "object") {
          if (item.format) {
            item.format = this.setFormat(item.format)
          }
          if (item.field === "object") {
            if (item.field.conditional) {
              item.field = this.setField(item.field.isVal)
            }
          }
          if (item.classes) {
            if (typeof(item.classes) === "object") {
              item.classes = this.setClasses(item.classes)
            }
          }
          if (item.label.validationAppMode) {
            if (item.label.validationAppMode === "iadmin") {
              item.label = item.label.isTranslatable === "singular" ? this.$tr(item.label.value) : this.$trp(item.label.value)
              if (item.format) {
                item.format = this.setFormat(item.format, item.label)
              }
            } else {
              item.label = "-"
            }
          }else if (item.label.include) {
            item.label = item.label.isTranslatable === "singular" ? `${this.$tr(item.label.value)} ${item.label.include}` : `${this.$trp(item.label.value)} ${item.label.include}`
          } else {
            item.label = item.label.isTranslatable === "singular" ? this.$tr(item.label.value) : this.$trp(item.label.value)
          }
        }
        return item
      })
    },
    setClasses(classes) {
      if (classes.type === "conditional") {
        if (classes.method) {
          return (row) =>
            row[classes.child][classes.method](classes.value)
              ? classes.yes
              : classes.no
        }
      }
      return (row) => `${classes.value} ${this.color[row[classes.child]]}`
    },
    setShowAs(obj) {
      if (obj.type === "conditional") {
        return this.appMode === obj.isVal.ValidationAppMode.mode
          ? obj.isVal.yes
          : obj.isVal.no
      }
      if (obj.type === "grid") {
        return "grid"
      } else {
        return "table"
      }
    },
    setField(obj) {
      const { value, yes, no } = obj
      return (row) => (row[value] ? row[yes] : no)
    },
    filtersParams(requestParams, filter, root, obj) {
      if (obj) {
        if (obj.filter.customerId) {
          obj.filter.customerId = this.$store.state[obj.storeName][obj.child]
        }
        if (obj.filter.formId) {
          obj.filter.formId = this.$route.params
        }
        if (this.defaultFilter) {
          this.crud[root][requestParams][filter] = { ...this.defaultFilter }
        } else if (obj.filter[obj.filter.filter]) {
          obj.filter[obj.filter.filter.filtername] = obj.filter.filter
        }
      }
    },
    actions(actions) {
      actions.map((action) => {
        if (action.tooltip) {
          action.tooltip = this.$tr(action.tooltip)
        }
        if (action.label) {
          action.label = action.label.isTranslatable === "singular"
              ? this.$tr(action.label.value)
              : this.$trp(action.label.value)
        }
        if (action.action) {
          const method = action.action.method
          const value = action.action.value
          const path = action.action.path
          const params = {}
          if (typeof(action.action) === "object") {
            if (action.action.type == "modal") {
              action.action = this.setAction(action.action.type, value, null, null, action.action)
            }
          }
          if (typeof(action.action) === "object") {
            if (action.action.type === "ref") {
              if (action.action.params) {
                action.action = this.setAction(action.action.type, value, method, action.action.params)
              }
              action.action = this.setAction(action.action.type, value, method)
            }
          }
          if (typeof(action.action) === "object") {
            if (action.action.type === "helper") {
              if (action.action.useStore) {
                const method = action.action.method
                const value = action.action.value
                const store = action.action.store
                const path = action.action.path
                action.action = this.setAction(action.action.type,value,method,null, null, path, store)
              }
            }
          }
        }
        if(action.format) {
          action.format = this.setActionFormat(action.format)
        }
        return action
      })
    },
    /*grid(path, root) {
        if(typeof(path.component) === 'string') {
          let pathExplode = path.component.split('/')
          let packageName = pathExplode[1]
          let filePath = pathExplode.slice(4, pathExplode.length)
          this.crud.read[root].component = require(`modules${packageName}/_components/crud/${filePath}`)
        }
      },*/
    setAction(type,value, method, params, obj, path, store) {
      if (type === 'modal') {
        return (item) => {
          this.modal[obj.data] = item
          this.modal[obj.open] = true
        }
      }
      if(type === 'ref') {
        if (params) {
          if(method === 'loadform') {
            return (item) => this.refs[value][method]({
              auctionId: item[params["auctionId"]],
              extraFormId: item[params["extraFormId"]],
              modalProps: {
                title: `${this.$tr(params["modalProps"].title)} | ${item[params[modalProps].key]}`
              }
            })
          }
        } else {
          return (item) => this.refs[value][method](item)
        }
      }
      if(type === "helper") {
        return (item) => this.$helper[method](`${this.$store.state.qsiteApp[store]}${[path.replace('change', `${item[value]}`)]}`, true )
      }
      if(type === "customAuctions") {
        return (item) => {
          this.$alert.warning({
            mode: 'modal',
            title: this.$trp('isite.cms.label.cancel'),
            message: `<div>${this.$tr('iauctions.cms.auction')}: ${item.title}</div>`,
            actions: [
              {label: this.$tr('isite.cms.label.cancel'), color: 'grey-8'},
              {
                label: this.$tr('isite.cms.label.send'),
                color: 'red',
                handler: () => {
                  //request Params
                  let requestData = {status: 3}
                  //request
                  this.$crud.update('apiRoutes.qauction.auctions', item.id, requestData).then(response => {
                    this.$alert.info({message: `${this.$tr('isite.cms.message.recordCreated')}`})
                    //Emit event to refrsh crud
                    this.$emit('crud.data.refresh')
                  }).catch(error => {
                    this.$alert.error({message: `${this.$tr('isite.cms.message.recordNoCreated')}`})
                  })
                }
              },
            ]
          })
        }
      }
    },
    setActionFormat(format) {
      if(format.type == "conditional") {
        const _this = this
        return (field) => {
          if(format.validationAppMode) {
            debugger
            if(_this.appMode == format.validationAppMode.mode) {
              return format.yes
            }
          }
          if(format.method === 'include') {
            if(format.value.includes(field[format.child])) {
              return format.no
            }
          }
          if(field[format.child] != format.value ) {
            return format.no
          }
        }
      }
    },
    setFormat(format) {
      if (format.type) {
        if (format.type === "date") {
          if (format.include) {
            if (format.include.type === "long") {
              return (val) => (val ? this.$trd(val, format.include) : "-")
            } else {
              return (val) =>
                val ? this.$trd(`2021-01-01 ${val}`, format.include) : "-"
            }
          }
          return (val) => (val ? this.$trd(val) : "-")
        }
        if (format.type === "fulltime") {
          return (val) => (val ? `${val.h}:${val.i}:${val.s}` : "-")
        }
        if (format.type === "str") {
          if (format.child) {
            return (val) => (val ? val[format.child[0]] : "-")
          }
          return (val) => val || "-"
        }
        if (format.type === "geo") {
          return (row) =>
            row[format.child[0]]
              ? `Lat: ${row[format.child[0]].latitude} | Lng: ${
                  row[format.child[0]].longitude
                }`
              : "-"
        }
        if (format.type === "number") {
          if (format.symbol) {
            return (val) => (val ? `${format.symbol}${this.$trn(val)}` : "-")
          }
          return (val) => (val ? `${this.$trn(val)}` : "-")
        }
        if (format.type === "colNumber") {
          if (format.symbol) {
            return (val) => (val ? `${format.symbol}${this.$trn(val)}` : "-")
          }
          return (val) => (val ? `${this.$trc(val)}` : 0)
        }
        if (format.type === "array") {
          return (val) =>
            val
              ? val.map((item) => item[format.child[0]]).join(format.join)
              : "-"
        }
        if (format.type === "obj") {
          return (val) => (val ? Object.values(val).join(format.join) : "-")
        }
        if (format.type.includes("concat")) {
          if (format.type.includes("number")) {
            return (val) =>
              `${
                val[format.method](format.value) ? format.yes : format.no
              } ${this.$trn(val)}`
          }
          if (format.label && typeof(format.label) === "object") {
            const label =
              format.label.isTranslatable === "singular"
                ? this.$tr(format.label.value)
                : this.$trp(format.label.value)
            return (val) => (val ? `${label} ${val}` : "-")
          }
          if (format.child.length === 2) {
            if (format.params === "row") {
              return (val, row) =>
                `${row[format.child[0]]}, ${row[format.child[1]]}`
            }
            return (val) =>
              val ? `${val[format.child[0]]} ${val[format.child[1]]}` : "-"
          }
          if (format.label) {
            return (val) =>
              format.isTranslatable === "singular"
                ? this.$tr(`${format.value}${val}`)
                : this.$trp(`${format.value}${val}`)
          }
        }
        if (format.type === "percentage") {
          return (val, row) =>
            val
              ? row[format.child] == "percentage"
                ? this.$n(val / 100, "percent")
                : this.$trc(val)
              : "-"
        }
        if (format.type === "conditional") {
          const { isVal } = format
          if (isVal.validationAppMode) {
            return (val) =>
              config("app.mode") == isVal.validationAppMode ? val : "-"
          }
          if (isVal.value === 1) {
            return (val) =>
              val === 1 ? this.$tr(isVal.yes) : this.$tr(isVal.no)
          }
          if (isVal.params) {
            return (val, row) => (isVal.value ? isVal.yes : isVal.no)
          }
          if (isVal.type === "conditional") {
            return (val) =>
              val
                ? `${this.$tr(isVal.yes.yes)} (${
                    val <= 100 ? val : isVal.yes.no
                  })`
                : this.$tr(isVal.no)
          }
          if (typeof(isVal.yes) === "object") {
            return (val) => (val ? val[isVal.yes.child[0]] : isVal.no)
          }
          if (isVal.method) {
            if (isVal.method === "parseInt") {
              if (isVal.type === "concat") {
                return (val) =>
                  val
                    ? this.$tr(
                        `${isVal.label}.${
                          parseInt(val) ? "enabled" : "disabled"
                        }`
                      )
                    : "-"
              }
              return (val) =>
                val
                  ? parseInt(val)
                    ? this.$tr(isVal.yes)
                    : this.$tr(isVal.no)
                  : "-"
            }
          } else {
            return (val) => (val ? this.$tr(isVal.yes) : this.$tr(isVal.no))
          }
        }
      }
    },
    filters(filterObj) {
      for (let filterKey in filterObj) {
        const filterNameObj = filterObj[filterKey]
        this.crud["read"]["filters"] = {}
        for (let props in filterNameObj) {
          if (props === "filterName") {
            this.crud["read"]["filters"][filterNameObj[props]] =
              filterObj[filterKey]
          }
          if (props === "props") {
            const propsObj = filterNameObj[props]
            for (let keyProps in propsObj) {
              if (keyProps === "label") {
                const labelObj = propsObj[keyProps]
                for (let keyLabel in labelObj) {
                  if (labelObj[keyLabel]["type"] === "singular") {
                    this.crud["read"]["filters"][
                      filterObj[filterKey]["filterName"]
                    ][props][keyProps] = this.$tr(labelObj[keyLabel]["value"])
                  }
                }
              }
            }
          }
        }
      }
    },
  },
}
</script>
