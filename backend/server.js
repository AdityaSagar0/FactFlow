const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = (req, res, next) => {
const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Please login first.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const app = express();

const mongoClient = new MongoClient(process.env.MONGODB_URI);

async function connectMongoDB() {
  try {
    await mongoClient.connect();
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
}

connectMongoDB();

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
    }
  },
});

app.get("/", (req, res) => {
  res.send("FactFlow Backend is Running!");
});

app.post("/api/analyze",verifyToken,upload.single("image"),async (req, res) => {
  const { content,type} = req.body;
  const image = req.file;
  let imageUrl = "";

  if (image) {
  const uploadResult = await cloudinary.uploader.upload(
    `data:${image.mimetype};base64,${image.buffer.toString("base64")}`,
    {
      folder: "factflow",
    }
    );

    imageUrl = uploadResult.secure_url;
  } 

  const userId = req.user.userId;

  if (content && content.length > 10000) {
  return res.status(400).json({
    success: false,
    message: "Text content must be less than 10,000 characters.",
  });
  }

  if ((!content || content.trim() === "") && !image)  {
    return res.status(400).json({
      success: false,
      message: "Please enter text, a URL, or an image to analyze.",
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents:[
  {
    text: `
You are FactFlow, an AI-assisted digital content verification system.

Analyze the provided content for potential misinformation.

Content Type: ${type || "text"}

Text Content:
${content || "No text provided."}

Provide your response in exactly this format:

Risk Level: Low/Medium/High
Assessment: [short assessment]
Explanation: [simple explanation]

Important: Do not claim that the result is an absolute guarantee of truth.
`,
  },

      ...(image
      ?   [
          {
            inlineData: {
              mimeType: image.mimetype,
              data: image.buffer.toString("base64"),
            },
          },
        ]
      : []),
    ],
    });

    const db = mongoClient.db("FactFlow");

    const analyses = db.collection("analyses");

    await analyses.insertOne({
    userId: userId,
    content: content || "",
    type: type || "text",
    imageUrl: imageUrl,
    analysis: response.text,
    createdAt: new Date(),
    });

    res.json({
    success: true,
    content: content,
    analysis: response.text,
    });

  } catch (error) {
    console.error("Gemini Error:", error);

    res.status(500).json({
      success: false,
      message: "AI analysis failed.",
    });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    const db = mongoClient.db("FactFlow");
    const users = db.collection("users");

    const existingUser = await users.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    };

    await users.insertOne(newUser);

    res.json({
      success: true,
      message: "Registration successful.",
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const db = mongoClient.db("FactFlow");
    const users = db.collection("users");

    const user = await users.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
});

app.get("/api/analyses",verifyToken, async (req, res) => {
  try {
    const db = mongoClient.db("FactFlow");
    const analyses = db.collection("analyses");

    const results = await analyses
      .find({userId: req.user.userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      analyses: results,
    });
  } catch (error) {
    console.error("Fetch analyses error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch analysis history.",
    });
  }
});

app.get("/api/gemini-test", async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Say hello to FactFlow in one short sentence.",
    });

    res.json({
      success: true,
      response: response.text,
    });
  
    } catch (error) {
  console.error("Gemini Error:", error);


  res.status(500).json({
    success: false,
    message: "AI analysis failed.",
  });
}
  
});

app.get("/api/cloudinary-test", async (req, res) => {
  try {
    const result = await cloudinary.api.ping();

    res.json({
      success: true,
      message: "Cloudinary connected successfully.",
      result,
    });
  } catch (error) {
    console.error("Cloudinary Error:", error);

    res.status(500).json({
      success: false,
      message: "Cloudinary connection failed.",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`FactFlow backend running on http://localhost:${PORT}`);
});

