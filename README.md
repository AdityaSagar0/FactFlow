# FactFlow – Intelligent Digital Content Verification & Misinformation Detection Platform

FactFlow is an AI-assisted digital content verification platform designed to analyze text, URLs, and images for potential misinformation.

## Features

- User registration and login
- JWT-based authentication
- Text content analysis
- URL input analysis
- Image analysis
- AI-assisted misinformation analysis using Gemini API
- Risk levels: Low, Medium, High
- Analysis history
- Risk analysis dashboard
- MongoDB Atlas database
- Cloudinary image storage
- Responsive web interface

## Technology Stack

### Frontend
- React.js
- Vite
- Recharts
- CSS

### Backend
- Node.js
- Express.js
- REST APIs

### AI
- Google Gemini API

### Database & Storage
- MongoDB Atlas
- Cloudinary

### Security
- JWT
- bcrypt
- Input validation
- File type and size validation

## Project Structure

```text
FactFlow/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ...
├── .gitignore
└── README.md


## Installation & Setup

### 1. Backend Setup

Open a terminal in the backend folder:

cd backend
npm install
node server.js

http://localhost:5000

### 2.Frontend Setup

Open a terminal in the Frontend folder:

cd frontend
npm install
npm run dev

http://localhost:5173

## Risk Levels

- **Low Risk** – Lower indicators of potential misinformation.
- **Medium Risk** – Some indicators require attention.
- **High Risk** – Stronger indicators of potential misinformation.

FactFlow provides AI-assisted analysis and does not guarantee that content is absolutely true or false.

## How It Works

1. User logs into FactFlow.
2. User submits text, a URL, or an image.
3. The backend receives the content.
4. Gemini AI analyzes the submitted content.
5. FactFlow generates a risk level and explanation.
6. The result is stored in MongoDB.
7. Uploaded images are stored using Cloudinary.
8. Previous analyses are displayed in the dashboard and history.

## Future Scope

- Support for additional languages
- More advanced source credibility analysis
- Deepfake and video analysis
- Larger-scale content monitoring
- Additional verification techniques

## Developer

**Aditya Sagar**

B.Tech – Artificial Intelligence & Data Science

## Environment Variables

Create a `.env` file inside the `backend` folder.

Add the following variables:

```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
