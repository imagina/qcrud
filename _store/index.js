import _cloneDeep from 'lodash.clonedeep'
export default {
  
  namespaced: true,
  // strict: true,
  state: {
    records: [], // get many - filter, page & sort
    totalRecs: 0,
    record: {}, // selected record
    pagination: {},
    filterData: {},
    defaultRec: {},
    fieldsData: {},
    configNames: {
      storeName:'',
      pluralName:'',
      singularName:''
    },
    
    crudOps: {
      export: null,
      index: null,
      delete: null,
      show: null,
      create: null,
      update: null
    }
  },
  getters: {
    record(state) {
      return state.record
    },
    records(state) {
      return state.records
    },
    totalRecs(state) {
      return state.totalRecs
    },
    filterData(state) {
      return state.filterData
    },
    fieldsData(state) {
      return state.fieldsData
    },
    pagination(state) {
      return state.pagination
    },
    defaultRec(state) {
      return state.defaultRec
    },
    crudOps(state) {
      return state.crudOps
    }
  },
  mutations: {
    setRecords(state, payload) {
      state.records = payload.records
      state.totalRecs = payload.totalRecs
    },
    setRecord(state, payload) {
      if (payload === null) state.record = (typeof state.defaultRec === 'function') ? state.defaultRec() : _cloneDeep(state.defaultRec)
      else state.record = _cloneDeep(payload)
    },
    setPagination(state, payload) {
      state.pagination = payload
    },
    setFilterData(state, payload) {
      state.filterData = payload
    }
  },
  actions: { // Edit Actions
    setPagination({commit}, payload) {
      commit('setPagination', payload)
    },
    async deleteRecord({commit, getters, state}, payload) {
      await getters.crudOps.delete(payload, state.configNames)
    },
    async getRecord({commit, getters, state}, payload) {
      let record = await getters.crudOps.show(payload, state.configNames)
      commit('setRecord', record)
    },
    async getRecords({commit, getters, state}, payload) {
      //payload.user = this.getters.user
      let {records, pagination} = await getters.crudOps.index(payload, state.configNames)
      const totalRecs = records.length
      commit('setPagination', pagination)
      commit('setFilterData', payload.filterData)
      commit('setRecords', {records, totalRecs})
    },
    async exportRecords({commit, getters, state}, payload) {
      await getters.crudOps.export(payload, state.configNames)
    },
    async updateRecord({commit, getters, state}, payload) {
      await getters.crudOps.update(payload, state.configNames)
    },
    async createRecord({commit, getters, state}, payload) {
      await getters.crudOps.create(payload, state.configNames)
    }
  }
}