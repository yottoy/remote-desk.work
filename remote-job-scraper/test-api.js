const axios = require('axios');

async function test() {
  try {
    console.log('Testing API...');
    const response = await axios.get('http://localhost:8000');
    console.log('Response:', response.data);
    
    console.log('Testing search...');
    const searchData = {
      search_terms: ['remote data entry'],
      location: 'Remote',
      results_wanted: 3,
      hours_old: 72,
      country_indeed: 'USA',
      is_remote: true
    };
    
    const searchResponse = await axios.post('http://localhost:8000/scrape-indeed', searchData);
    console.log('Found jobs:', searchResponse.data.count);
    if (searchResponse.data.count > 0) {
      console.log('First job:', searchResponse.data.jobs[0].title);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
