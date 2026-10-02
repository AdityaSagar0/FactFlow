import { useState, useEffect  } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

function App() {

  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [imageError, setImageError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [analyses, setAnalyses] = useState([]);
  const riskData = [
  {
    name: "Low Risk",
    value: analyses.filter((item) =>
      item.analysis?.includes("Risk Level: Low")
    ).length,
  },
  {
    name: "Medium Risk",
    value: analyses.filter((item) =>
      item.analysis?.includes("Risk Level: Medium")
    ).length,
  },
  {
    name: "High Risk",
    value: analyses.filter((item) =>
      item.analysis?.includes("Risk Level: High")
    ).length,
  },
  ];

  useEffect(() => {
  const token = localStorage.getItem("token");

  fetch("https://factflow-backend-nbqr.onrender.com/api/analyses", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        setAnalyses(data.analyses);
      }
    })
    .catch((error) => {
      console.error("History fetch error:", error);
    });
      }, []);

  const handleRegister = async () => {
  setAuthMessage("");

  try {
    const response = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const data = await response.json();

    setAuthMessage(data.message);
  } catch {
    setAuthMessage("Registration failed. Check backend connection.");
  }
  };

  const handleLogin = async () => {
  setAuthMessage("");

  try {
    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      setAuthMessage("Login successful!");
    } else {
      setAuthMessage(data.message);
    }
  } catch {
    setAuthMessage("Login failed. Check backend connection.");
  }
  };

  

  const analyzeContent = async () => {
    
    setMessage("");

    if (!content.trim() && !image) {
      setMessage("Please enter text, a URL, or select an image to analyze.");
      return;
      }

    if (
    content.trim() &&
    (content.startsWith("http://") || content.startsWith("https://")) === false &&
    content.includes(".")
    ) {
    setMessage("Please enter a valid URL starting with http:// or https://");
    return;
    }
  
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("content", content);

      formData.append(
      "type",
        content.startsWith("http://") || content.startsWith("https://")
        ? "URL"
        : "Text"
      );

      if (image) {
      formData.append("image", image);
      }

      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/analyze", {
      method: "POST",
      headers: {
      Authorization: `Bearer ${token}`,
      },
      body: formData,
      });

      const data = await response.json();

      setMessage(data.analysis);
    
      } catch {
      setMessage("Backend connection failed!");
      } finally {
      setLoading(false);
      }
    };
      
  return (
    <div className="app">
      <div className="container">

        <h1 className="title">FactFlow</h1>

        <h2 className="subtitle">
          Intelligent Digital Content Verification
        </h2>

        <p className="description">
          Analyze digital content and identify potential misinformation.
        </p>

      <div className="dashboard">

      <div className="dashboard-stats">
      <div className="stat-card">
      <h3>Total</h3>
      <p>{analyses.length}</p>
      </div>

      <div className="stat-card">
      <h3>Low Risk</h3>
      <p>{riskData[0].value}</p>
      </div>

      <div className="stat-card">
      <h3>Medium Risk</h3>
      <p>{riskData[1].value}</p>
      </div>

        <div className="stat-card">
        <h3>High Risk</h3>
        <p>{riskData[2].value}</p>
        </div>
        </div>

        <h2>Risk Analysis Dashboard</h2>

        <PieChart width={400} height={300}>
        <Pie
        data={riskData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={100}
        label
        >
        {riskData.map((entry, index) => (
        <Cell
        key={`cell-${index}`}
        fill={["#22c55e", "#f59e0b", "#ef4444"][index]}
        />
        
        ))}
        </Pie>

        <Tooltip />
        <Legend />
        </PieChart>
        </div>

        <div className="history">

        

        <h2>Analysis History ({analyses.length})</h2>
        
        <button
        onClick={async () => {
        try {
        const token = localStorage.getItem("token");

        const response = await fetch("https://factflow-backend-nbqr.onrender.com/api/analyses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        });
        

        const data = await response.json();
        if (data.success) {
        setAnalyses(data.analyses);
        } else {
        console.error("Failed to refresh history");
        }
        } catch (error) {
        console.error("History refresh error:", error);
        }
        }}
        >
        Refresh History
        </button>

        {analyses.length === 0 ? (
        <p>No previous analyses found.</p>
        ) : (
        analyses.map((item, index) => (
        <div className="history-item" key={index}>

        {item.imageUrl && (
        <img
        src={item.imageUrl}
        alt="Analyzed content"
        className="history-image"
        />
        )}

        <p>
        <strong>Date:</strong>{" "}
        {item.createdAt
        ? new Date(item.createdAt).toLocaleString()
        : "Unknown"}
        </p>

        <p>
          <strong>Type:</strong> {item.type}
        </p>

        <p>
          <strong>Content:</strong> {item.content}
        </p>

        <div>
        <strong>Analysis:</strong>

        <p className="history-analysis">
        {item.analysis}
        </p>
        </div>

        </div>
        ))
        )}
        </div>

        <div className="card">

          <div className="auth-section">
          <h2>Create Account</h2>

          <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          />

          <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          />

          <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleRegister}>
            Register
          </button>

          {authMessage && <p>{authMessage}</p>}
          </div>

          <button
          onClick={() => {
          localStorage.removeItem("token");
          setAuthMessage("Logged out successfully.");
           }}
          >
            Logout
          </button>

          <div className="auth-section">
          <h2>Login</h2>

          <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          />

          <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleLogin}>
              Login
          </button>

          {authMessage && <p>{authMessage}</p>}
          </div>

          <textarea
            placeholder="Enter text that you want to verify..."
            rows="10"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <input
          type="url"
          placeholder="Or enter a URL to verify..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          />

          <input
          type="file"
          accept="image/*"
          onChange={(e) => {
          const selectedImage = e.target.files[0];

          setImageError("");

          if (selectedImage && !selectedImage.type.startsWith("image/")) {
          setImageError("Please select a valid image file.");
          e.target.value = "";
          setImage(null);
          return;
          } 

          if (selectedImage && selectedImage.size > 5 * 1024 * 1024) {
          setImageError("Image size must be less than 5 MB.");
          e.target.value = "";
          setImage(null);
          return;
          }

          if (selectedImage) {
          const img = new Image();

          img.onerror = () => {
          setImageError("Unable to load this image.");
          e.target.value = "";
          setImage(null);
          };

          img.onload = () => {
          if (img.width < 100 || img.height < 100) {
          setImageError("Image dimensions must be at least 100 × 100 pixels.");
          e.target.value = "";
          setImage(null);
          return;
          }

          setImage(selectedImage);
          };

          img.src = URL.createObjectURL(selectedImage);
          }
          }}
          />

          {imageError && (
          <p style={{ color: "red" }}>{imageError}</p>
          )}

          {image && (
          <div>
          <p>Selected Image:</p>
          <img
            src={URL.createObjectURL(image)}
            alt="Preview"
            width="250"
          />
          <button onClick={() => setImage(null)}>
              Remove Image
          </button>


          </div>
          )}

          <br />

          <button onClick={analyzeContent} disabled={loading}>
                  {loading ? "Analyzing..." : "Analyze Content"}
          </button>

          {message && (
          <div className="result">
          <h3>FactFlow AI Analysis</h3>
          <p>{message}</p>
          </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default App;