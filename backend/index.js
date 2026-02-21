const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/interview_questions', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const uploadRoute = require('./routes/upload');
app.use('/api/upload', uploadRoute);

const questionsRoute = require('./routes/questions');
app.use('/api/questions', questionsRoute);

// Root route
app.get('/', (req, res) => {
  res.send('Interview Questions API running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 