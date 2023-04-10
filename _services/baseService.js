import axios from 'axios'
import {remember} from '@imagina/qsite/_plugins/remember'
import {helper} from '@imagina/qsite/_plugins/helper'
import cache from '@imagina/qsite/_plugins/cache'
import config from '@imagina/qsite/_config/master/index'
import apiResponse from '@imagina/qcrud/_plugins/apiResponse'

//Replace params in apiRoute
function replaceParamsApiRoute(apiRoute, params) {
  for (var paramName in params) apiRoute = apiRoute.replace(`{${paramName}}`, params[paramName].toString())
  return apiRoute
}


export default {
  /**
   * Create a item
   * @param configName
   * @param data
   * @returns {Promise<any>}
   */
  create(configName, data, params = {}) {
    return new Promise((resolve, reject) => {
      //Validations
      if (!configName) return reject('Config name is required')
      if (!data) return reject('Data is required')
      let urlApi = (config(configName) || configName)//Get url from config
      let dataRequest = helper.toSnakeCase(data, {notToSnakeCase: (params.notToSnakeCase || [])})

      //Request
      axios.post(urlApi, {attributes: dataRequest}).then(async response => {
        await cache.remove({allKey: configName})//Clear api Route cache
        this.clearCache()//Clear Cache
        resolve(response.data)//Successful response
      }).catch(error => {
        reject((error.response && error.response.data) ? error.response.data.errors : {});//Failed response
      })
    })
  },

  /**
   * Get items by params
   * @param configName
   * @param params {params : {}, remember: boolean}
   * @returns {Promise<any>}
   */
  index(configName, params = {}, isOffline = false) {
    return new Promise((resolve, reject) => {
      params = {params: {}, refresh: false, cacheTime: (3600 * 3), ...params}//Validate params params
      if (!configName) return reject('Config name is required')//Validate config name
      let urlApi = (config(configName) || configName)//Get url from config
      let key = `${configName}::${isOffline ? 'offline' : `requestParams[${JSON.stringify(params.params)}]`}`//Key to cache

      remember.async({
        key: key,
        seconds: params.cacheTime,
        refresh: params.refresh,
        callBack: () => {
          return new Promise(async (resolve, reject) => {
            await axios.get(urlApi, {params: params.params}).then(response => {
              resolve(response)//Response
            }).catch(error => {
              apiResponse.handleError(error, () => {
                console.error('[base-service-index-callback]Error::', error)
              })
              reject(error.response || error)//Response
            })
          })
        }
      }).then(response => resolve(response)).catch(error => {
        apiResponse.handleError(error, () => {
          console.error('[base-service-index]Remember-Error::', error)
        })
        reject(error)
      })
    })
  },

  /**
   * Get a item
   * @param configName
   * @param criteria
   * @param params {params : {}, remember: boolean}
   * @returns {Promise<any>}
   */
  show(configName, criteria, params = {}) {
    return new Promise((resolve, reject) => {
      params = {params: {}, refresh: false, cacheTime: (3600 * 3), ...params}//Validate params params
      if (!configName) return reject('Config name is required')//Validate Config name
      if (!criteria) return reject('Criteria is required')//Validate criteria
      let urlApi = (config(configName) || configName) + '/' + criteria//Get url from config
      let key = `${configName}::requestParams[${JSON.stringify(params.params)}]`//Key to cache

      remember.async({
        key: key,
        seconds: params.cacheTime,
        refresh: params.refresh,
        callBack: () => {
          return new Promise(async (resolve, reject) => {
            axios.get(urlApi, {params: params.params}).then(response => {
              resolve(response)//Response
            }).catch(error => {
              apiResponse.handleError(error, () => {
                reject(error.response || error)
              })
            })
          })
        }
      }).then(response => resolve(response)).catch(error => reject(error))
    })
  },

  /**
   * Update a item
   * @param configName
   * @param criteria
   * @param data
   * @param params {params : {}, remember: boolean}
   * @returns {Promise<any>}
   */
  update(configName, criteria, data, params = {params: {}}) {
    return new Promise((resolve, reject) => {
      //Validations
      if (!configName) return reject('Config name is required')
      if (!criteria) return reject('Criteria is required')
      if (!data) return reject('Data is required')
      let urlApi = (config(configName) || configName) + '/' + criteria//Get url from config
      //Get request params
      let requestParams = Object.assign((params.params || {}), {
        attributes: helper.toSnakeCase(data, {notToSnakeCase: (params.notToSnakeCase || [])})
      })
      //Request
      axios.put(urlApi, requestParams).then(async response => {
        await cache.remove({allKey: configName})//Clear api Route cache
        this.clearCache()//Clear Cache
        resolve(response.data)//Successful response
      }).catch(error => {
        reject((error.response && error.response.data) ? error.response.data.errors : {});//Failed response
      })
    })
  },

  /**
   * Update the order of record item
   * @param configName
   * @param criteria
   * @param data
   * @param params {params : {}, remember: boolean}
   * @returns {Promise<any>}
   */
  bulkOrder(configName, data, params = {params: {}}) {
    return new Promise((resolve, reject) => {
      //Validations
      if (!configName) return reject('Config name is required')
      if (!data) return reject('Data is required')
      let urlApi = `${(config(configName) || configName)}/bulk/order`//Get url from config
      //Get request params
      let requestParams = Object.assign((params.params || {}), {
        attributes: helper.toSnakeCase(data, {notToSnakeCase: (params.notToSnakeCase || [])})
      })
      //Request
      axios.put(urlApi, requestParams).then(async response => {
        await cache.remove({allKey: configName})//Clear api Route cache
        this.clearCache()//Clear Cache
        resolve(response.data)//Successful response
      }).catch(error => {
        reject((error.response && error.response.data) ? error.response.data.errors : {});//Failed response
      })
    })
  },

  /**
   * Delete a item
   * @param configName
   * @param criteria
   * @param data
   * @param params {params : {}, remember: boolean}
   * @returns {Promise<any>}
   */
  delete(configName, criteria, params) {
    return new Promise((resolve, reject) => {
      //Validations
      if (!configName) return reject('Config name is required')
      if (!criteria) return reject('Criteria is required')
      let urlApi = (config(configName) || configName) + '/' + criteria//Get url from config
      let requestParams = (params && params.params) ? params.params : false//Get request params
      //Request
      axios.delete(urlApi, {params: requestParams}).then(response => {
        this.clearCache()//Clear Cache
        resolve(response.data)//Successful response
      }).catch(error => {
        reject(error.response.data.errors)//Failed response
      })
    })
  },

  /**
   * Post Method
   * @param configName
   * @param data
   * @returns {Promise<any>}
   */
  post(configName, data = {}) {
    return new Promise((resolve, reject) => {
      //Validations
      if (!configName) return reject('Config name is required')
      if (!data) return reject('Data is required')
      let urlApi = replaceParamsApiRoute((config(configName) || configName), data || {})//Get url from config

      //Request
      axios.post(urlApi, data).then(response => {
        resolve(response.data || response)//Successful response
      }).catch(error => {
        reject(error)//Failed response
      })
    })
  },

  /**
   * Get Method
   * @param configName
   * @param params
   */
  get(configName, params = {}, data) {
    return new Promise((resolve, reject) => {
      //Validations
      if (!configName) return reject('Config name is required')
      let urlApi = replaceParamsApiRoute((config(configName) || configName), data || {})//Get url from config

      //Request
      axios.get(urlApi, {params: params}).then(response => {
        resolve(response.data || response)//Successful response
      }).catch(error => {
        reject(error)//Failed response
      })
    })
  },

  /**
   * Put a item
   * @param configName
   * @param criteria
   * @param data
   * @param params {params : {}, remember: boolean}
   * @returns {Promise<any>}
   */
  put(configName, data) {
    return new Promise((resolve, reject) => {
      //Validations
      if (!configName) return reject('Config name is required')
      if (!data) return reject('Data is required')

      //Request
      axios.put((config(configName) || configName), data).then(response => {
        resolve(response.data)//Successful response
      }).catch(error => {
        reject(error)//Failed response
      })
    })
  },

  /**
   * Request to clear backend cache
   */
  clearCache() {
    return new Promise(async (resolve, reject) => {
      await this.post('apiRoutes.qsite.cacheClear').catch(error => reject(error))
      resolve(true)
    })
  }
}
