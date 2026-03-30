import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://stxanozxvkerwfvbruzr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0eGFub3p4dmtlcndmdmJydXpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg4NDMzMywiZXhwIjoyMDkwNDYwMzMzfQ.a3STl9xBvp8kNMn5nN4p5l2gfTdK3Qg8y0Qj5JHFvxc'
)

async function main() {
  // Try to insert into flights table
  const { data, error } = await supabase
    .from('flights')
    .insert({
      flight_number: 'TEST123',
      airline: 'TestAir',
      origin: 'JFK',
      destination: 'LAX',
      date: '2025-01-01',
      status: 'completed',
    })
    .select()

  console.log('flights insert error:', JSON.stringify(error))
  console.log('flights insert data:', data ? 'success' : 'null')
}

main()
