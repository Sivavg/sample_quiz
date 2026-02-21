const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const Question = require('../models/Question');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// POST /upload - upload multiple images and extract text
router.post('/', upload.array('images'), async (req, res) => {
  try {
    const files = req.files;
    const results = [];
    for (const file of files) {
      const imagePath = file.path;
      const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
      const question = new Question({
        questionText: text.trim().split('\n')[0],
        extractedText: text,
        options: [],
      });
      await question.save();
      fs.unlinkSync(imagePath);
      results.push(question);
    }
    res.json({ success: true, questions: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 