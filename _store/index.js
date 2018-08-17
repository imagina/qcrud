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
    async deleteRecord({commit, getters}, payload) {
      await getters.crudOps.delete(payload)
    },
    async getRecord({commit, getters}, payload) {
      let record = await getters.crudOps.show(payload)
      commit('setRecord', record)
    },
    async getRecords({commit, getters}, payload) {
      //payload.user = this.getters.user
      let {records, pagination} = await getters.crudOps.index(payload)
      const totalRecs = records.length
      commit('setPagination', pagination)
      commit('setFilterData', payload.filterData)
      commit('setRecords', {records, totalRecs})
    },
    async exportRecords({commit, getters}, payload) {
      await getters.crudOps.export(payload)
    },
    async updateRecord({commit, getters}, payload) {
      await getters.crudOps.update(payload)
    },
    async createRecord({commit, getters, dispatch}, payload) {
      await getters.crudOps.create(payload)
    }
  }
}