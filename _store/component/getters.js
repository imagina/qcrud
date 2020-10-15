export const getDataComponent = (state) => (keyModule) => {
  return state.component[keyModule] || {}//Return component data
}

export const getField = (state) => (params) => {
  if(!params.id) return 'Field "id" is required'
  if(!params.fieldName) return 'Field "fieldName" is required'

  let component = state.component[params.id] || {}//Get component
  
  return component[params.fieldName]//Return response
}
