require("dotenv").config();
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const express = require("express");
const SSLCommerzPayment = require("sslcommerz-lts");
const cors = require("cors");

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

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false; //true for live, false for sandbox

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const fundCollection = client.db("fundDB").collection("fund");

    const userCollection = client.db("fundDB").collection("users");

    const donationCollection = client.db("fundDB").collection("donation");

    const newCollection = client.db("fundDB").collection("add");

    const moneyCollection = client.db("fundDB").collection("money");

    app.get("/fund", async (req, res) => {
      const cursor = fundCollection.find().limit(6);
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
      // console.log(newFund);
      const result = await fundCollection.insertOne(newFund);
      res.send(result);
    });

    app.get("/myfunds/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await fundCollection.findOne(query);
      res.send(result);
    });

    app.put("/myfunds/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedCampaign = req.body;
      const campaign = {
        $set: {
          deadline: updatedCampaign.deadline,
          description: updatedCampaign.description,
          email: updatedCampaign.email,
          minDonation: updatedCampaign.minDonation,
          name: updatedCampaign.name,
          thumbnail: updatedCampaign.thumbnail,
          title: updatedCampaign.title,
          type: updatedCampaign.type,
        },
      };
      const result = await fundCollection.updateOne(filter, campaign, options);
      res.send(result);
    });

    app.delete("/myfunds/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await fundCollection.deleteOne(query);
      res.send(result);
    });

    // users related apis

    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      // console.log("creating new user", newUser);
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
      // console.log("creating new donation", newDonation);
      const result = await donationCollection.insertOne(newDonation);
      res.send(result);
    });

    //payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      // console.log(amount, "amount inside  the intent");
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card "],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    //sslCommerz

    const tran_id = new ObjectId().toString();

   app.post("/order", async (req, res) => {
  // const tran_id = new ObjectId().toString(); // এটা কোথাও ডিফাইন করা হয়নি, করতে হবে
  const order = req.body;

  const data = {
    total_amount: order?.minDonation,
    currency: "BDT",
    tran_id: tran_id,
    success_url: `http://localhost:5000/payment/success/${tran_id}`,
    fail_url: `http://localhost:5000/payment/fail/${tran_id}`,
    cancel_url: "http://localhost:3030/cancel",
    ipn_url: "http://localhost:3030/ipn",
    shipping_method: "Courier",
    product_name: order?.name,
    product_category: "Electronic",
    product_profile: "general",
    cus_name: order?.name,
    cus_email: order?.email,
    cus_add1: "Dhaka",
    cus_add2: "Dhaka",
    cus_city: "Dhaka",
    cus_state: "Dhaka",
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: "01711111111",
    cus_fax: "01711111111",
    ship_name: "Customer Name",
    ship_add1: "Dhaka",
    ship_add2: "Dhaka",
    ship_city: "Dhaka",
    ship_state: "Dhaka",
    ship_postcode: 1000,
    ship_country: "Bangladesh",
  };

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  sslcz.init(data).then((apiResponse) => {
    let GatewayPageURL = apiResponse.GatewayPageURL;
    res.send({ url: GatewayPageURL });

    const finalDonation = {
      order,
      paidStatus: false,
      transactionId: tran_id,
    };
    moneyCollection.insertOne(finalDonation);
  });
});

// ✅ এই রাউটগুলো আলাদা করে রাখো:
app.post("/payment/success/:tranId", async (req, res) => {
  const result = await moneyCollection.updateOne(
    { transactionId: req.params.tranId },
    {
      $set: {
        paidStatus: true,
      },
    }
  );

  if (result.modifiedCount > 0) {
    res.redirect(
      `http://localhost:5173/payment/success/${req.params.tranId}`
    );
  }
});

app.post("/payment/fail/:tranId", async (req, res) => {
  const result = await moneyCollection.deleteOne({
    transactionId: req.params.tranId,
  });

  if (result.deletedCount) {
    res.redirect(
      `http://localhost:5173/payment/fail/${req.params.tranId}`
    );
  }
});


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
