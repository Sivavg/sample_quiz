const express = require('express');
const Question = require('../models/Question');

const router = express.Router();

let lastQuestionId = null;

// Get all questions (optionally filter by category)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    const questions = await Question.find(filter);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a random question
router.get('/random', async (req, res) => {
  try {
    const count = await Question.countDocuments();
    if (count === 0) {
      return res.status(404).json({ error: 'No questions available.' });
    }
    let question;
    let attempts = 0;
    do {
      const random = Math.floor(Math.random() * count);
      question = await Question.findOne().skip(random);
      attempts++;
    } while (question && lastQuestionId && question._id.equals(lastQuestionId) && attempts < 5);
    lastQuestionId = question ? question._id : null;
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/questions - create a new question (multiple-choice or short-answer)
router.post('/', async (req, res) => {
  try {
    const { questionText, options, answer, category } = req.body;
    if (!questionText) {
      return res.status(400).json({ error: 'Question text is required.' });
    }
    if (!category || !['frontend', 'backend', 'common'].includes(category)) {
      return res.status(400).json({ error: 'Category is required and must be frontend, backend, or common.' });
    }
    if (options && Array.isArray(options) && options.length >= 2) {
      if (!options.some(opt => opt.isCorrect)) {
        return res.status(400).json({ error: 'At least one option must be marked as correct.' });
      }
      const question = new Question({ questionText, options, category });
      await question.save();
      return res.json(question);
    } else if (answer && typeof answer === 'string' && answer.trim().length > 0) {
      const question = new Question({ questionText, answer: answer.trim(), category });
      await question.save();
      return res.json(question);
    } else {
      return res.status(400).json({ error: 'Provide either at least two options or a short answer.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a question (add/edit options, correct answer, etc.)
router.put('/:id', async (req, res) => {
  try {
    const { questionText, options } = req.body;
    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      { questionText, options },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a question
router.delete('/:id', async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/questions/fix-categories - set category to 'frontend' for all questions missing it
router.patch('/fix-categories', async (req, res) => {
  try {
    const result = await Question.updateMany(
      { $or: [ { category: { $exists: false } }, { category: null } ] },
      { $set: { category: 'frontend' } }
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 