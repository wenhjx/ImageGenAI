import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkData() {
  const { data: users, error: usersError } = await supabase.from('users').select('*');
  console.log('Users:', users, 'Error:', usersError);
  
  if (users && users[0]) {
    const { data: credits, error: creditsError } = await supabase.from('credits').update({ balance: 10 }).eq('user_id', users[0].id);
    console.log('Credits updated:', credits, 'Error:', creditsError);
  }
}

checkData();
