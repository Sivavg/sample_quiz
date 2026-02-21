import React, { useEffect, useState, useRef } from 'react';
import { Box, Paper, Typography, Button, CircularProgress, RadioGroup, FormControlLabel, Radio, Alert, TextField, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Mic, MicOff } from '@mui/icons-material';
import axios from 'axios';

const Quiz = () => {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(null); // 'voice' or 'text'
  const [askedIds, setAskedIds] = useState([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [category, setCategory] = useState('frontend');
  const [categorySelected, setCategorySelected] = useState(false);

  const fetchRandomQuestion = async (cat = category) => {
    setLoading(true);
    setSelected(null);
    setFeedback('');
    setShowAnswer(false);
    setTypedAnswer('');
    setListening(false);
    setError('');
    setMode(null);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    let timeoutId;
    try {
      timeoutId = setTimeout(() => {
        setLoading(false);
        setError('Request timed out. Please check your backend server is running and accessible at http://localhost:5000.');
      }, 20000); // 20 seconds
      // Get all questions for the selected category if not already loaded
      let allQuestions = window._allQuestions;
      if (!allQuestions || window._allQuestionsCategory !== cat) {
        const res = await axios.get(`http://localhost:5000/api/questions?category=${cat}`);
        allQuestions = res.data;
        window._allQuestions = allQuestions;
        window._allQuestionsCategory = cat;
      }
      // Filter out already asked
      const available = allQuestions.filter(q => !askedIds.includes(q._id));
      if (available.length === 0) {
        setQuizComplete(true);
        setLoading(false);
        setQuestion(null);
        return;
      }
      // Pick a random available question
      const randomIdx = Math.floor(Math.random() * available.length);
      const q = available[randomIdx];
      setQuestion(q);
      setAskedIds(prev => [...prev, q._id]);
      setLoading(false);
      clearTimeout(timeoutId);
    } catch (err) {
      setLoading(false);
      clearTimeout(timeoutId);
      if (err.message && err.message.includes('Network Error')) {
        setError('Cannot connect to backend. Please ensure your backend server is running at http://localhost:5000.');
      } else {
        setError('Failed to load question. Please try again.');
      }
      setQuestion(null);
      console.error('Quiz fetch error:', err);
    }
  };

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTypedAnswer(transcript);
        setListening(false);
      };
      recognition.onend = () => {
        setListening(false);
        // Auto-submit after user stops talking in voice mode and short-answer
        if (mode === 'voice' && question && question.answer && typedAnswer.trim()) {
          setTimeout(() => {
            document.getElementById('voice-auto-submit')?.click();
          }, 200); // slight delay to ensure state is updated
        }
      };
      recognition.onerror = () => {
        setListening(false);
      };
      recognitionRef.current = recognition;
    }
    fetchRandomQuestion();
    // eslint-disable-next-line
  }, []);

  const handleSelect = (idx) => {
    setSelected(idx);
    if (question.options[idx].isCorrect) {
      setFeedback('Correct! Moving to next question...');
      setTimeout(() => {
        fetchRandomQuestion();
      }, 1200);
    } else {
      setFeedback('Incorrect. Try again!');
      setShowAnswer(true);
    }
  };

  // Add a function to compute similarity between two strings (Levenshtein distance based)
  function similarity(a, b) {
    if (!a || !b) return 0;
    a = a.trim().toLowerCase();
    b = b.trim().toLowerCase();
    if (a === b) return 1;
    const matrix = [];
    let i;
    for (i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    let j;
    for (j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    const distance = matrix[b.length][a.length];
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : (1 - distance / maxLen);
  }

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    if (selectedMode === 'voice' && question && question.questionText) {
      speak(question.questionText);
      setTimeout(() => {
        if (recognitionRef.current) {
          setListening(true);
          recognitionRef.current.start();
        }
      }, 1000);
    }
  };

  const handleShortAnswer = (e) => {
    e.preventDefault();
    const correct = (question.answer || '').trim().toLowerCase();
    const user = typedAnswer.trim().toLowerCase();
    const sim = similarity(user, correct);
    if (sim >= 0.5) {
      setFeedback('Correct! Moving to next question...');
      if (mode === 'voice') speak('Correct answer is: ' + question.answer);
      setTimeout(() => {
        fetchRandomQuestion();
      }, 2000);
    } else {
      setFeedback('Incorrect. Try again!');
      if (mode === 'voice') speak('Correct answer is: ' + question.answer);
      setShowAnswer(true);
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    }
  };

  const handleMicClick = () => {
    if (!listening && recognitionRef.current) {
      setListening(true);
      recognitionRef.current.start();
    } else if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!question) return null;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Quiz</Typography>
        {!categorySelected ? (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Select a category to start the quiz:</Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="quiz-category-label">Category</InputLabel>
              <Select
                labelId="quiz-category-label"
                value={category}
                label="Category"
                onChange={e => setCategory(e.target.value)}
              >
                <MenuItem value="frontend">Frontend</MenuItem>
                <MenuItem value="backend">Backend</MenuItem>
                <MenuItem value="common">Common</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" color="primary" onClick={() => { setCategorySelected(true); setAskedIds([]); setQuizComplete(false); window._allQuestions = undefined; fetchRandomQuestion(category); }}>Start Quiz</Button>
          </Box>
        ) : quizComplete ? (
          <Box>
            <Typography variant="h5" color="success.main">Quiz complete!</Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => {
              setAskedIds([]);
              setQuizComplete(false);
              setCategorySelected(false);
              window._allQuestions = undefined;
            }}>
              Restart Quiz
            </Button>
          </Box>
        ) : (
          <>
            {mode === null && question && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">How do you want to answer?</Typography>
                <Button variant="contained" color="primary" sx={{ mr: 2 }} onClick={() => handleModeSelect('voice')}>Voice</Button>
                <Button variant="outlined" color="primary" onClick={() => handleModeSelect('text')}>Text</Button>
              </Box>
            )}
            {mode && question && (
              <>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>{question.questionText}</Typography>
                {question.answer ? (
                  mode === 'voice' ? (
                    <Box>
                      <TextField
                        label="Your Answer (speak now)"
                        value={typedAnswer}
                        onChange={e => setTypedAnswer(e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                        disabled
                      />
                      {voiceSupported && (
                        <Tooltip title={listening ? 'Stop Listening' : 'Speak Answer'}>
                          <span>
                            <IconButton onClick={handleMicClick} color={listening ? 'error' : 'primary'}>
                              {listening ? <MicOff /> : <Mic />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      <Button
                        id="voice-auto-submit"
                        variant="contained"
                        color="primary"
                        sx={{ mb: 2, mt: 1 }}
                        fullWidth
                        disabled={!typedAnswer.trim()}
                        onClick={handleShortAnswer}
                      >
                        Submit
                      </Button>
                    </Box>
                  ) : (
                    <form onSubmit={handleShortAnswer}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TextField
                          label="Your Answer"
                          value={typedAnswer}
                          onChange={e => setTypedAnswer(e.target.value)}
                          fullWidth
                          sx={{ mb: 2 }}
                          disabled={!!feedback && feedback.startsWith('Correct')}
                        />
                      </Box>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={!!feedback && feedback.startsWith('Correct') || !typedAnswer.trim()}
                        sx={{ mb: 2, mt: 1 }}
                        fullWidth
                      >
                        Submit
                      </Button>
                    </form>
                  )
                ) : (
                  <RadioGroup value={selected}>
                    {question.options.map((opt, idx) => (
                      <FormControlLabel
                        key={idx}
                        value={idx}
                        control={<Radio />}
                        label={opt.text}
                        onClick={() => handleSelect(idx)}
                        disabled={selected !== null && selected !== idx}
                        sx={{
                          background: showAnswer && opt.isCorrect ? '#e0ffe0' : 'none',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      />
                    ))}
                  </RadioGroup>
                )}
                {feedback && (
                  <Alert severity={feedback.startsWith('Correct') ? 'success' : 'error'} sx={{ mt: 2 }}>
                    {feedback}
                    {mode === 'text' && showAnswer && question.answer && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Correct answer: {question.answer}
                        </Typography>
                      </Box>
                    )}
                  </Alert>
                )}
                <Button sx={{ mt: 2 }} onClick={fetchRandomQuestion} disabled={loading}>
                  Skip / Next
                </Button>
              </>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Quiz; 