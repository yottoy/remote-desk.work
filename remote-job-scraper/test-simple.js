const axios = require('axios'); axios.get('http://localhost:8000').then(response => { console.log(response.data); }).catch(error => { console.error('Error:', error.message); });
