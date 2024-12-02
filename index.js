const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcrypt");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || process.env.SERVER_PORT;

app.use(cors());
app.use(express.json()); //parsing json request bodies

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.oc9fgut.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("Gym-Management");
    const usersCollection = db.collection("usersAuthInfo");

    // User Registration
    app.post("/register-trainer", async (req, res) => {
      console.log(req.body);
      const { fullname, email, password, role } = req.body;

      // Check if email already exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exist!!!",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await usersCollection.insertOne({
        fullname,
        email,
        password: hashedPassword,
        role,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully!",
      });
    });

    // User Login
    app.post("/login-user", async (req, res) => {
      const userInfo = req.body;
      // console.log("userInfo :", userInfo);

      const { email, password } = req.body;
      // console.log(email, password);

      // Find user by email
      const user = await usersCollection.findOne({ email });
      if (!user) {
        // console.log("user fount or not", user);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      // console.log("isPasswordValid matched :", isPasswordValid);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      // const token = jwt.sign(
      //   { email: user.email, role: user.role },
      //   process.env.JWT_SECRET,
      //   {
      //     expiresIn: process.env.EXPIRES_IN,
      //   }
      // );

      res.json({
        success: true,
        message: "User successfully logged in!",
        // accessToken: token,
      });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Let's healthy by reduceing fat!");
});

app.listen(port, () => {
  console.log(`Body builder make their body at ${port} port`);
});
