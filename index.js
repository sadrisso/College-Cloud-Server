require("dotenv").config();
const multer = require("multer");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
app.use("/uploads", express.static("uploads"));


app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oq68b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  const database = client.db("collegeCloudDB");
  const collegeCollection = database.collection("colleges");
  const admissionsCollection = database.collection("admissions");

  const fs = require("fs");
  if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
  });

  const upload = multer({ storage });

  app.post("/admissions", upload.single("image"), async (req, res) => {
    try {
      const { candidateName, subject, email, phone, address, dob, collegeId } =
        req.body;
      const image = req.file?.filename;

      const newAdmission = {
        candidateName,
        subject,
        email,
        phone,
        address,
        dob,
        collegeId,
        imageUrl: image ? `/uploads/${image}` : null,
        submittedAt: new Date(),
      };

      const result = await admissionsCollection.insertOne(newAdmission);
      res.status(200).send(result);
    } catch (error) {
      console.error("Admission error:", error);
      res.status(500).send({ error: "Admission submission failed." });
    }
  });

  app.get("/colleges", async (req, res) => {
    const result = await collegeCollection.find().toArray();
    res.send(result);
  });

  app.get("/colleges/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await collegeCollection.findOne(query);
    res.send(result);
  });

  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
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
  res.send("Hello from Express with CORS!");
});

app.listen(port, () => {
  console.log({ running: true, status: 200 });
});
