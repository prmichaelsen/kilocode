const { getSearchAndReplaceDescription } = require('./dist/prompts/tools/search-and-replace.js');

const args = {
  cwd: '/test/workspace',
  supportsComputerUse: false
};

try {
  const description = getSearchAndReplaceDescription(args);
  console.log('✅ Function works correctly!');
  console.log('Description includes cwd:', description.includes('/test/workspace'));
  console.log('Description includes expected content:', description.includes('search_and_replace'));
} catch (error) {
  console.error('❌ Error:', error.message);
}