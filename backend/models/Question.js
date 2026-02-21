const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
});

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [optionSchema], // for multiple-choice
  answer: { type: String }, // for short-answer
  category: { type: String, enum: ['frontend', 'backend', 'common'], required: true },
  extractedText: { type: String }, // raw OCR text
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Question', questionSchema); 