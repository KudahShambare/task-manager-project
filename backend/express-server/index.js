const express = require('express');
const cors = require('cors');

require('dotenv').config()







  const app = express();
  app.use(cors()); //will need optona
app.use(express.json()); //allow json request bodies


  app.post("/signin",(req,resp)=>{

    let email = req.body.email
    let password = req.body.password;


    console.log(email,password);

    resp.json({})
  })




app.listen(process.env.PORT, () => {
  console.log(`Task Manager API running on port ${process.env.PORT}`);
});
