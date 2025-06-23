// Quick script to check GitHub Actions artifacts that might be consuming storage
// This helps identify what's taking up space

const { execSync } = require('child_process');

console.log('🔍 GitHub Actions Storage Analysis');
console.log('='.repeat(50));

try {
  // Check if we have GitHub CLI installed
  const ghVersion = execSync('gh --version', { encoding: 'utf8' });
  console.log('GitHub CLI found:', ghVersion.split('\n')[0]);
  
  console.log('\n📦 Checking recent workflow runs...');
  
  // Get recent workflow runs
  const workflows = execSync('gh run list --limit 20 --json conclusion,createdAt,name,workflowName', { encoding: 'utf8' });
  const workflowData = JSON.parse(workflows);
  
  console.log(`Found ${workflowData.length} recent workflow runs:`);
  
  let failedRuns = 0;
  let successRuns = 0;
  
  workflowData.forEach((run, index) => {
    const date = new Date(run.createdAt).toLocaleDateString();
    const status = run.conclusion || 'running';
    
    if (status === 'failure') failedRuns++;
    if (status === 'success') successRuns++;
    
    if (index < 10) { // Show first 10
      console.log(`  ${index + 1}. ${run.workflowName} - ${status} (${date})`);
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`- Failed runs: ${failedRuns} (these can be safely deleted)`);
  console.log(`- Successful runs: ${successRuns}`);
  console.log(`- Total runs: ${workflowData.length}`);
  
  if (failedRuns > 5) {
    console.log(`\n⚠️  You have ${failedRuns} failed runs that can be cleaned up to save storage.`);
  }
  
  console.log('\n💡 To clean up storage:');
  console.log('1. Wait for the "Emergency Storage Cleanup" workflow to appear in GitHub Actions');
  console.log('2. Or run the existing "Cleanup Old Artifacts" workflow manually');
  console.log('3. Or delete old workflow runs manually from the GitHub Actions tab');
  
} catch (error) {
  console.log('❌ GitHub CLI not found or not authenticated.');
  console.log('💡 Manual cleanup options:');
  console.log('1. Go to your repository on GitHub');
  console.log('2. Click Actions tab');
  console.log('3. Look for workflows with artifacts and delete them');
  console.log('4. Focus on failed runs first - they usually have the most artifacts');
}

console.log('\n🎯 The optimized workflows I just created will prevent future storage issues!'); 