<template>
  <div class="contributors">
    <div v-if="loading" class="loading">
      Loading...
    </div>
    <div v-if="error" class="error">
      {{ error }}
    </div>
    <div v-if="contributors" class="content">
      {{contributors}}
    </div>
  </div>
</template>

<script>
export default {
  data() { 
    return {
      loading: true,
      error: null,
      contributors: null 
    }
  },
  created () {
    // fetch the data when the view is created and the data is
    // already being observed
    this.fetchData()
  },
  methods: {
    fetchData () {
      this.post = null
      this.loading = true
      // replace `getPost` with your data fetching util / API wrapper
      fetch("https://raw.githubusercontent.com/MarketSquare/robotframework-browser/master/.all-contributorsrc")
	.then(response => { response.text()
	  .then(text => {
	    this.loading = false
	    this.contributors = text 
	    }
	  )
	}).catch(err => this.error = err.toString())
    }
  }
}
</script>
