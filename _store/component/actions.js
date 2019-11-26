//Set new component
export function SET_COMPONENT({commit, state}, params) {
  return new Promise((resolve, reject) => {
    //Validate field
    if(!params.id) return reject('Field "id" is require')
    if(!params.data) return reject('Field "data" is require')
    //Commit to create component
    commit('SET_COMPONENT',params)
    commit('REACTIVE_COMPONENT')
    //Response component
    resolve(state.component[params.id])
  })
}

//Update data component
export function SET_DATA_COMPONENT({commit, state}, params) {
  return new Promise((resolve, reject) => {
    //Validate field
    if(!params.id) return reject('Field "id" is require')
    if(!params.data) return reject('Field "data" is require')
    //Commit to create component
    commit('SET_DATA_COMPONENT',params)
    commit('REACTIVE_COMPONENT')
    //Response component
    resolve(state.component[params.id])
  })
}

//Set new component
export function DELETE_COMPONENT({commit, state}, componentId) {
  return new Promise((resolve, reject) => {
    //Validate field
    if(!componentId) return reject('"id" is require')
    //Commit to create component
    commit('DELETE_COMPONENT',componentId)
    commit('REACTIVE_COMPONENT')
    //Response component
    resolve(true)
  })
}
