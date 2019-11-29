export function SET_COMPONENT(state, params) {
  let component = state.component//Get current components
  component[params.id] = params.data//Set new component
  state.component = component//Set in state data
}

export function SET_DATA_COMPONENT(state, params) {
  let component = state.component//Get current components
  component[params.id] = {...component[params.id], ...params.data}//Merge data component
  state.component = JSON.parse(JSON.stringify(component))//Set in state data
}

export function DELETE_COMPONENT(state, componentId) {
  let component = state.component//Get current components
  delete component[componentId] //Delete component
  state.component = component//Set in state data
}

export function REACTIVE_COMPONENT(state) {
  let component = state.component//Get current components
  state.component = null//Set data
  state.component = component
}
