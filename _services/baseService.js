import axios from 'axios'
import {remember} from '@imagina/qhelper/_plugins/remember'
import {helper} from '@imagina/qhelper/_plugins/helper'
import config from '@imagina/qsite/_config/master/index'

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
  create(configName, data) {
    return new Promise((resolve, reject) => {
      //Validations
      if (!configName) return reject('Config name is required')
      if (!data) return reject('Data is required')
      let urlApi = config(configName)//Get url from config
      let dataRequest = helper.toSnakeCase(data)

      //Request
      axios.post(urlApi, {attributes: dataRequest}).then(response => {
        resolve(response.data)//Successful response
      }).catch(error => {
        reject(error.response.data.errors)//Failed response
      })
    })
  },

  /**
   * Get items by params
   * @param configName
   * @param params {params : {}, remember: boolean}
   * @returns {Promise<any>}
   */
  index(configName, params = {}) {
    return new Promise((resolve, reject) => {
      //Calidate if exist config name
      if (!configName) return reject('Config name is required')
      //Default params
      let defaultParams = {params: {}, refresh: false, remember: true, cacheTime: (3600 * 3)}
      params = Object.assign({}, defaultParams, params)//Merge params

      let urlApi = config(configName)//Get url from config
      let requestParams = (params && params.params) ? params.params : false//Get request params

      //Remember request
      if (params && params.remember) {
        let key = !requestParams ? configName : configName + JSON.stringify(requestParams)//Key for rememeber
        remember.async(//Call method remember
          key, params.cacheTime,
          () => {
            return axios.get(urlApi, {params: requestParams})
          }, params.refresh
        ).then(response => {
          resolve(response)//Successful response
        }).catch(error => {
          reject(error)//Failed response
        })
      } else {//Request without remember
        axios.get(urlApi, {params: requestParams}).then(response => {
          resolve(response.data)//Successful response
        }).catch(error => {
          reject(error.response.data.errors)//Failed Response
        })
      }
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
      //Validations
      if (!configName) return reject('Config name is required')
      if (!criteria) return reject('Criteria is required')
      //Default params
      let defaultParams = {params: {}, refresh: false, remember: true, cacheTime: (3600 * 3)}
      params = Object.assign({}, defaultParams, params)//Merge params

      let urlApi = config(configName) + '/' + criteria//Get url from config
      let requestParams = (Object.keys(params.params).length) ? params.params : {}//Get request params

      if (params && params.remember) {//Remember request
        let key = !requestParams ? configName : configName + JSON.stringify(requestParams)//Key for rememeber
        remember.async(//Call method remember
          key, (params.cacheTime),
          () => {
            return axios.get(urlApi, {params: requestParams})
          }, params.refresh
        ).then(response => {
          resolve(response)//Successful response
        }).catch(error => {
          reject(error)//Failed response
        })
      } else {//Request without remember
        axios.get(urlApi, {params: requestParams}).then(response => {
          resolve(response.data)//Successful response
        }).catch(error => {
          reject(error.response.data.errors)//Failed Response
        })
      }
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
      let urlApi = config(configName) + '/' + criteria//Get url from config
      //Get request params
      let requestParams = Object.assign(params.params, {attributes: helper.toSnakeCase(data)})
      //Request
      axios.put(urlApi, requestParams).then(response => {
        resolve(response.data)//Successful response
      }).catch(error => {
        reject(error.response.data.errors)//Failed response
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
      let urlApi = config(configName) + '/' + criteria//Get url from config
      let requestParams = (params && params.params) ? params.params : false//Get request params
      //Request
      axios.delete(urlApi, requestParams).then(response => {
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
  post(configName, data) {
    return new Promise((resolve, reject) => {
      //Validations
      if (!configName) return reject('Config name is required')
      if (!data) return reject('Data is required')
      let urlApi = replaceParamsApiRoute(config(configName), data || {})//Get url from config

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
  get(configName, params = {}) {
    return new Promise((resolve, reject) => {
      //Validations
      if (!configName) return reject('Config name is required')
      let urlApi = replaceParamsApiRoute(config(configName), data || {})//Get url from config

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
      axios.put(config(configName), data).then(response => {
        resolve(response.data)//Successful response
      }).catch(error => {
        reject(error)//Failed response
      })
    })
  },
}
