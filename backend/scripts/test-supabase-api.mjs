const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0eGFub3p4dmtlcndmdmJydXpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg4NDMzMywiZXhwIjoyMDkwNDYwMzMzfQ.a3STl9xBvp8kNMn5nN4p5l2gfTdK3Qg8y0Qj5JHFvxc';
const PROJECT_REF = 'stxanozxvkerwfvbruzr';

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: 'SELECT 1 as test' })
}).then(r => {
  console.log('Status:', r.status, r.statusText);
  return r.json();
}).then(d => {
  console.log('Response:', JSON.stringify(d).slice(0, 300));
}).catch(e => {
  console.error('Error:', e.message);
});
