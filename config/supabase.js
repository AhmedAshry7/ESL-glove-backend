const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Creating a supabase client
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SERVICE_ROLE_KEY
);

module.exports = supabase;