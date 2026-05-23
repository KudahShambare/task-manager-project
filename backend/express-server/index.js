import { signInWithEmail, signUpWithEmail, supabase } from './scripts/supabase.js'; 
import express from "express";
import cors from "cors"

import { configDotenv } from 'dotenv';


const app = express()

  app.use(cors()); //will need optona
app.use(express.json()); //allow json request bodies


// At the top of index.js, make sure supabase is imported

app.post('/signup', async (req, res) => {
  const { email, password, fullname } = req.body;
  
  console.log(req.body);
  

  // 1. Check if all fields were provided
  if (!email || !password || !fullname) {
    return res.status(400).json({ message: "Missing required fields 5" });
  }

  try {
    // 2. Create the user in Supabase Auth (Hidden 'auth.users' table)
    const { data, error } = await signUpWithEmail(email, password, fullname);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // --- NEW: Insert into your public.profiles table ---
    // We pass data.user.id so the profile ID perfectly matches their Auth ID
    const { error: dbError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id, 
          email: data.user.email,
          full_name: fullname
        }
      ]);

    if (dbError) {
      console.error("Database insert failed:", dbError);
      // Optional: You could delete the Auth user here to keep things perfectly clean,
      // but for a prototype, just returning an error is fine.
      return res.status(500).json({ message: "Account created, but profile setup failed." });
    }
    // ----------------------------------------------------

    // 3. Send the successful response back to React!
    return res.status(201).json({
      message: "Signup successful!",
      user: {
        id: data.user.id,
        email: data.user.email,
        name: fullname
      },
      token: data.session?.access_token || null
    });

  } catch (err) {
    console.error("Server error during signup:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});



  /**************************************** */


  // NEW: Sign Up Route
app.post('/signin', async (req, res) => {
  const { email, password, fullname } = req.body;

 const run = async ()=>{
    let response = await signInWithEmail(email,password)
    console.log(response)

    return response;
}

let data =await run()

});




app.listen(process.env.PORT, () => {
  console.log(`Task Manager API running on port ${process.env.PORT}`);
});
