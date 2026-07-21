const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createProductsTable() {
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      query: `CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        stock INTEGER NOT NULL
      )`
    });

    if (error) {
      console.error('Error creating table:', error);
      return false;
    }

    console.log('Table created successfully:', data);
    return true;
  } catch (err) {
    console.error('Exception:', err);
    return false;
  }
}

async function testTable() {
  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    
    if (error) {
      console.error('Error testing table:', error);
      return false;
    }

    console.log('Table test successful. Data:', data);
    return true;
  } catch (err) {
    console.error('Exception:', err);
    return false;
  }
}

async function main() {
  console.log('Attempting to create products table...');
  
  const created = await createProductsTable();
  
  if (created) {
    console.log('\nTesting table access...');
    await testTable();
  }
}

main();
