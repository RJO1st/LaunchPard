// src/lib/supabase.js
// Note for GitHub: Ensure this file exports your actual Supabase client (using @supabase/supabase-js).
// This mock ensures successful compilation in environments without environment variables.
export const supabase = {
  from: (table) => ({
    select: () => ({
      ilike: () => ({
        lte: async () => ({ data: [], error: null })
      })
    }),
    insert: async (data) => {
      console.log(`[Mock] Inserting ${data.length} rows into ${table}...`);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data, error: null });
        }, 1500);
      });
    }
  })
};
