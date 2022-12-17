const express = require("express");
const connectToMongo = require("./db");
const cors=require('cors');
connectToMongo();
const app = express();
// const host='0.0.0.0';
app.use(cors());
const port = 5000;
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// available routes in a modular way
// routes for authentication



app.use("/api/auth", require("./routes/auth"));
app.use('/api/notes',require('./routes/notes'));

app.listen(port,() => {
  console.log(`server running at ${port} port`);
});
