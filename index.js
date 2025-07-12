require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oq68b.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

let collegeCollection;
let admissionsCollection;

async function connectToDatabase() {
  try {
    // await client.connect();
    const db = client.db("collegeCloudDB");
    collegeCollection = db.collection("colleges");
    admissionsCollection = db.collection("admissions");
    reviewsCollection = db.collection("reviews");
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Database connection error:", error);
  }
}
connectToDatabase();

// Setup file upload
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Routes
app.get("/", (req, res) => {
  res.send("🚀 College Cloud Server is running");
});

app.get("/colleges", async (req, res) => {
  const search = req.query.search;

  let query = {};
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }
  try {
    const result = await collegeCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to load colleges" });
  }
});

app.get("/colleges/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await collegeCollection.findOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to load college" });
  }
});

app.get("/admissions", async (req, res) => {
  const email = req.query.email;
  const filter = { userEmail: email };
  try {
    const result = await admissionsCollection.find(filter).toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to load colleges" });
  }
});

app.post("/reviews", async (req, res) => {
  try {
    const reviewData = req.body;
    const result = await reviewsCollection.insertOne(reviewData);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to submit review" });
  }
});

app.post("/admissions", upload.single("image"), async (req, res) => {
  try {
    const {
      candidateName,
      subject,
      email,
      phone,
      address,
      dob,
      collegeId,
      collegeImage,
      collegeName,
      userEmail,
    } = req.body;
    const image = req.file?.filename;

    const newAdmission = {
      candidateName,
      subject,
      email,
      phone,
      address,
      dob,
      collegeId,
      collegeImage,
      collegeName,
      userEmail,
      imageUrl: image ? `/uploads/${image}` : null,
      submittedAt: new Date(),
    };

    const result = await admissionsCollection.insertOne(newAdmission);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to submit admission" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🌐 Server is running on port ${port}`);
});
