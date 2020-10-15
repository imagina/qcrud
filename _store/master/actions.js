/*Services*/
import crud from '@imagina/qcrud/_services/baseService'

//Get and Save data as INDEX method
export function INDEX({commit, state}, params) {
  return new Promise((resolve, reject) => {
    //Validate required fields
    if (!params.indexName) return reject('indexName is required')
    if (!params.apiRoute) return reject('apiRoute is required')

    //Request
    crud.index(params.apiRoute, params.requestParams || {}).then(response => {
      let dataIndex = Object.assign({}, state.index) //Get current dataIndex
      dataIndex[params.indexName] = {...params, ...response} //Set to data index the result
      commit('SET_INDEX_DATA', dataIndex)//Commit data index
      resolve(response)//Return response
    }).catch(error => {
      reject(error)
    })
  })
}

//Get and Save data as SHOW method
export function SHOW({commit, state}, params) {
  return new Promise((resolve, reject) => {
    //Validate required fields
    if (!params.apiRoute) return reject('apiRoute is required')
    if (!params.criteria) return reject('Criteria is required')
    if (!params.indexName) return reject('indexName is required')

    let defaultParamsRequest = {filter: {field: 'slug'}}//Default params
    //Define params request
    if (params.requestParams) {
      //Merge request params with default request params or create request params
      params.requestParams.params = params.requestParams.params ?
        {...defaultParamsRequest, ...params.requestParams.params} : defaultParamsRequest
    } else params.requestParams = {params: defaultParamsRequest}

    crud.show(params.apiRoute, params.criteria, params.requestParams).then(response => {
      let dataShow = Object.assign({}, state.show) //Get current dataIndex
      dataShow[params.indexName] = {...params, ...response} //Set to data index the result
      commit('SET_SHOW_DATA', dataShow)//Commit data index
      resolve(response)//Return response
    }).catch(error => {
      reject(error)
    })
  })
}
