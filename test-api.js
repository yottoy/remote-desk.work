const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

async function testJobSpyAPI() {
  console.log("Testing JobSpy Bridge API");
  
  const bridgeUrl = "http://localhost:8000";
  
  try {
    console.log("Checking if bridge is running...");
    const statusResponse = await axios.get(bridgeUrl);
    console.log("Bridge status:", statusResponse.data);
    
    console.log("Sending search request...");
    const requestData = {
      search_terms: ["remote data entry"],
      location: "Remote",
      results_wanted: 5,
      hours_old: 72,
      country_indeed: "USA",
      is_remote: true
    };
    
    const searchResponse = await axios.post(`${bridgeUrl}/scrape-indeed`, requestData);
    const { jobs, count, metadata } = searchResponse.data;
    
    console.log(`Found ${count} jobs in ${metadata.duration_seconds.toFixed(2)} seconds`);
    
    if (count > 0) {
      console.log("Sample job:");
      console.log(`Title: ${jobs[0].title}`);
      console.log(`Company: ${jobs[0].company}`);
      console.log(`URL: ${jobs[0].job_url}`);
      
      const outputDir = path.join(process.cwd(), "test-results");
      await fs.mkdir(outputDir, { recursive: true });
      
      const outputPath = path.join(outputDir, "jobspy-api-test.json");
      await fs.writeFile(outputPath, JSON.stringify(jobs, null, 2));
      
      console.log(`Results saved to ${outputPath}`);
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data));
    }
  }
}

testJobSpyAPI(); 