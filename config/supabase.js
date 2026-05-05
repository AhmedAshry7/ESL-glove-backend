const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// This client is strictly for Storage and Auth
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SERVICE_ROLE_KEY // Needed to bypass security for merging/deleting
);

module.exports = supabase;