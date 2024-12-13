const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w4irz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const fundCollection = client.db("fundDB").collection("fund");

    const userCollection = client.db("fundDB").collection("users");

    const donationCollection = client.db("fundDB").collection("donation");

    const newCollection = client.db("fundDB").collection("add")

    // db.orders.find().sort( { amount: -1 } )

    app.get("/fund", async (req, res) => {
      const cursor = fundCollection.find().limit(6).sort({ minDonation: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/funds", async (req, res) => {
      const cursor = fundCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/myfunds", async (req, res) => {
      const cursor = fundCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/fund/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await fundCollection.findOne(query);
      res.send(result);
    });

    app.post("/fund", async (req, res) => {
      const newFund = req.body;
      console.log(newFund);
      const result = await fundCollection.insertOne(newFund);
      res.send(result);
    });

    app.delete("/myfunds/:id", async(req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = {_id:new ObjectId(id)};
      const result = await fundCollection.deleteOne(query);
      res.send(result);
    })

    // users related apis

    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      console.log("creating new user", newUser);
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    // donation related apis

    app.get("/donation", async (req, res) => {
      const cursor = donationCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/donation", async (req, res) => {
      const newDonation = req.body;
      console.log("creating new donation", newDonation);
      const result = await donationCollection.insertOne(newDonation);
      res.send(result);
    });

    // add related apis
    // app.post("/add", async (req, res) => {
    //   const addDonation = req.body;
    //   console.log("creating new donation", addDonation);
    //   const result = await newCollection.insertOne(addDonation);
    //   res.send(result);
    // });

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
  res.send("crowd funding server is running");
});

app.listen(port, () => {
  console.log(`crowd funding server is running on port: ${port}`);
});
