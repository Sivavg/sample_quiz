import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, IconButton, Button, List, ListItem, ListItemText, ListItemSecondaryAction, Radio, RadioGroup, FormControlLabel, CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Save, Add, Delete } from '@mui/icons-material';
import axios from 'axios';

const EditQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ questionText: '', options: [] });
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState('frontend');

  useEffect(() => {
    fetchQuestions(category);
  }, [category]);

  const fetchQuestions = async (cat) => {
    setLoading(true);
    const res = await axios.get(`http://localhost:5000/api/questions?category=${cat}`);
    setQuestions(res.data);
    setLoading(false);
  };

  const startEdit = (q) => {
    setEditingId(q._id);
    setEditData({
      questionText: q.questionText,
      options: q.options.length ? q.options : [{ text: '', isCorrect: false }],
    });
  };

  const handleOptionChange = (idx, value) => {
    const newOptions = [...editData.options];
    newOptions[idx].text = value;
    setEditData({ ...editData, options: newOptions });
  };

  const handleCorrectChange = (idx) => {
    const newOptions = editData.options.map((opt, i) => ({ ...opt, isCorrect: i === idx }));
    setEditData({ ...editData, options: newOptions });
  };

  const addOption = () => {
    setEditData({ ...editData, options: [...editData.options, { text: '', isCorrect: false }] });
  };

  const removeOption = (idx) => {
    const newOptions = editData.options.filter((_, i) => i !== idx);
    setEditData({ ...editData, options: newOptions });
  };

  const saveEdit = async () => {
    setSaving(true);
    // Always set the category to the current filter
    const updatedData = { ...editData, category };
    await axios.put(`http://localhost:5000/api/questions/${editingId}`, updatedData);
    setEditingId(null);
    setEditData({ questionText: '', options: [] });
    setSaving(false);
    fetchQuestions(category);
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="edit-category-label">Category</InputLabel>
        <Select
          labelId="edit-category-label"
          value={category}
          label="Category"
          onChange={e => setCategory(e.target.value)}
        >
          <MenuItem value="frontend">Frontend</MenuItem>
          <MenuItem value="backend">Backend</MenuItem>
          <MenuItem value="common">Common</MenuItem>
        </Select>
      </FormControl>
      <Typography variant="h6" sx={{ mb: 2 }}>Edit Questions</Typography>
      <List>
        {questions.map((q) => (
          <ListItem key={q._id} alignItems="flex-start">
            {editingId === q._id ? (
              <Paper sx={{ p: 2, width: '100%' }}>
                <TextField
                  label="Question Text"
                  value={editData.questionText}
                  onChange={e => setEditData({ ...editData, questionText: e.target.value })}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <Typography variant="subtitle2">Options</Typography>
                <RadioGroup
                  value={editData.options.findIndex(opt => opt.isCorrect)}
                  onChange={(_, idx) => handleCorrectChange(Number(idx))}
                >
                  {editData.options.map((opt, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <FormControlLabel
                        value={idx}
                        control={<Radio />}
                        label={
                          <TextField
                            value={opt.text}
                            onChange={e => handleOptionChange(idx, e.target.value)}
                            size="small"
                            placeholder={`Option ${idx + 1}`}
                          />
                        }
                      />
                      <IconButton onClick={() => removeOption(idx)} disabled={editData.options.length <= 1}>
                        <Delete />
                      </IconButton>
                    </Box>
                  ))}
                </RadioGroup>
                <Button startIcon={<Add />} onClick={addOption} sx={{ mt: 1 }}>
                  Add Option
                </Button>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Save />}
                    onClick={saveEdit}
                    disabled={saving}
                  >
                    Save
                  </Button>
                  <Button sx={{ ml: 2 }} onClick={() => setEditingId(null)} disabled={saving}>
                    Cancel
                  </Button>
                </Box>
              </Paper>
            ) : (
              <ListItemText
                primary={q.questionText}
                secondary={q.options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt.text}${opt.isCorrect ? ' (Correct)' : ''}`).join('  ')}
              />
            )}
            {editingId !== q._id && (
              <ListItemSecondaryAction>
                <Button variant="outlined" onClick={() => startEdit(q)}>
                  Edit
                </Button>
              </ListItemSecondaryAction>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default EditQuestions; 