import React, { useState } from 'react';
import { Box, Button, Typography, LinearProgress, Paper, Grid, TextField, IconButton, Radio, RadioGroup, FormControlLabel, Switch, FormControl, FormLabel, MenuItem, Select, InputLabel } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import axios from 'axios';

const Upload = () => {
  // Manual question form state
  const [isShortAnswer, setIsShortAnswer] = useState(true);
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualAnswer, setManualAnswer] = useState('');
  const [manualOptions, setManualOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
  ]);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualSuccess, setManualSuccess] = useState('');
  const [manualError, setManualError] = useState('');
  const [category, setCategory] = useState('frontend');

  // Bulk image upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  // Manual form handlers
  const handleManualOptionChange = (idx, value) => {
    const newOptions = [...manualOptions];
    newOptions[idx].text = value;
    setManualOptions(newOptions);
  };
  const handleManualCorrectChange = (idx) => {
    setManualOptions(manualOptions.map((opt, i) => ({ ...opt, isCorrect: i === idx })));
  };
  const addManualOption = () => {
    setManualOptions([...manualOptions, { text: '', isCorrect: false }]);
  };
  const removeManualOption = (idx) => {
    if (manualOptions.length <= 2) return;
    setManualOptions(manualOptions.filter((_, i) => i !== idx));
  };
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualSubmitting(true);
    setManualSuccess('');
    setManualError('');
    // Validation
    if (!category) {
      setManualError('Please select a category.');
      setManualSubmitting(false);
      return;
    }
    if (isShortAnswer) {
      if (!manualQuestion.trim() || !manualAnswer.trim()) {
        setManualError('Both question and answer are required.');
        setManualSubmitting(false);
        return;
      }
    } else {
      const filledOptions = manualOptions.filter(opt => opt.text.trim());
      if (!manualQuestion.trim() || filledOptions.length < 2) {
        setManualError('Question and at least two options are required.');
        setManualSubmitting(false);
        return;
      }
      if (!filledOptions.some(opt => opt.isCorrect)) {
        setManualError('At least one option must be marked as correct.');
        setManualSubmitting(false);
        return;
      }
    }
    try {
      let payload;
      if (isShortAnswer) {
        payload = { questionText: manualQuestion, answer: manualAnswer, category };
      } else {
        payload = { questionText: manualQuestion, options: manualOptions, category };
      }
      const res = await axios.post('http://localhost:5000/api/questions', payload);
      setManualSuccess('Question added!');
      setManualQuestion('');
      setManualAnswer('');
      setManualOptions([
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ]);
    } catch (err) {
      setManualError(err.response?.data?.error || 'Failed to add question');
    } finally {
      setManualSubmitting(false);
    }
  };

  // Bulk image upload handlers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setResults([]);
    setError(null);
    setPreviews(files.map(file => URL.createObjectURL(file)));
  };
  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    setUploading(true);
    setProgress(0);
    setResults([]);
    setError(null);
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('images', file));
    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        },
      });
      setResults(res.data.questions);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Add Question Manually</Typography>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Question Type</FormLabel>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography>Short Answer</Typography>
            <Switch checked={isShortAnswer === false} onChange={() => setIsShortAnswer(v => !v)} />
            <Typography>Multiple Choice</Typography>
          </Box>
        </FormControl>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setManualSubmitting(true);
          setManualSuccess('');
          setManualError('');
          // Validation
          if (!category) {
            setManualError('Please select a category.');
            setManualSubmitting(false);
            return;
          }
          if (isShortAnswer) {
            if (!manualQuestion.trim() || !manualAnswer.trim()) {
              setManualError('Both question and answer are required.');
              setManualSubmitting(false);
              return;
            }
          } else {
            const filledOptions = manualOptions.filter(opt => opt.text.trim());
            if (!manualQuestion.trim() || filledOptions.length < 2) {
              setManualError('Question and at least two options are required.');
              setManualSubmitting(false);
              return;
            }
            if (!filledOptions.some(opt => opt.isCorrect)) {
              setManualError('At least one option must be marked as correct.');
              setManualSubmitting(false);
              return;
            }
          }
          try {
            let payload;
            if (isShortAnswer) {
              payload = { questionText: manualQuestion, answer: manualAnswer, category };
            } else {
              payload = { questionText: manualQuestion, options: manualOptions, category };
            }
            const res = await axios.post('http://localhost:5000/api/questions', payload);
            setManualSuccess('Question added!');
            setManualQuestion('');
            setManualAnswer('');
            setManualOptions([
              { text: '', isCorrect: true },
              { text: '', isCorrect: false },
            ]);
          } catch (err) {
            setManualError(err.response?.data?.error || 'Failed to add question');
          } finally {
            setManualSubmitting(false);
          }
        }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              value={category}
              label="Category"
              onChange={e => setCategory(e.target.value)}
              required
            >
              <MenuItem value="frontend">Frontend</MenuItem>
              <MenuItem value="backend">Backend</MenuItem>
              <MenuItem value="common">Common</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Question Text"
            value={manualQuestion}
            onChange={e => setManualQuestion(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          {isShortAnswer ? (
            <TextField
              label="Answer"
              value={manualAnswer}
              onChange={e => setManualAnswer(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
          ) : (
            <>
              <Typography variant="subtitle2">Options</Typography>
              <RadioGroup
                value={manualOptions.findIndex(opt => opt.isCorrect)}
                onChange={(_, idx) => handleManualCorrectChange(Number(idx))}
              >
                {manualOptions.map((opt, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FormControlLabel
                      value={idx}
                      control={<Radio />}
                      label={
                        <TextField
                          value={opt.text}
                          onChange={e => handleManualOptionChange(idx, e.target.value)}
                          size="small"
                          placeholder={`Option ${idx + 1}`}
                          required
                        />
                      }
                    />
                    <IconButton onClick={() => removeManualOption(idx)} disabled={manualOptions.length <= 2}>
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
              </RadioGroup>
              <Button startIcon={<Add />} onClick={addManualOption} sx={{ mt: 1, mb: 2 }} type="button">
                Add Option
              </Button>
            </>
          )}
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={manualSubmitting}
            >
              Add Question
            </Button>
            {manualSuccess && <Typography color="success.main" sx={{ ml: 2 }}>{manualSuccess}</Typography>}
            {manualError && <Typography color="error" sx={{ ml: 2 }}>{manualError}</Typography>}
          </Box>
        </form>
      </Paper>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6">Or Upload Images</Typography>
        <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={uploading} />
        {previews.length > 0 && (
          <Grid container spacing={2} mt={2}>
            {previews.map((src, idx) => (
              <Grid item xs={4} key={idx}>
                <img src={src} alt={`Preview ${idx}`} style={{ maxWidth: '100%', maxHeight: 120 }} />
              </Grid>
            ))}
          </Grid>
        )}
        <Box mt={2}>
          <Button variant="contained" color="primary" onClick={handleUpload} disabled={!selectedFiles.length || uploading}>
            Upload & Extract
          </Button>
        </Box>
        {uploading && <LinearProgress variant="determinate" value={progress} sx={{ mt: 2 }} />}
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        {results.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle1">Extracted Questions Preview:</Typography>
            {results.map((q, idx) => (
              <Paper key={q._id || idx} sx={{ p: 2, mt: 1, background: '#f5f5f5' }}>
                <Typography>{q.questionText}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  (Full OCR text: {q.extractedText})
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Upload; 