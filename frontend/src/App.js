import React from 'react';
import { Container, AppBar, Tabs, Tab, Box, Typography } from '@mui/material';
// Placeholder imports for future components
import Upload from './components/Upload';
import EditQuestions from './components/EditQuestions';
import Quiz from './components/Quiz';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [tab, setTab] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  return (
    <Container maxWidth="md">
      <AppBar position="static" color="primary">
        <Tabs value={tab} onChange={handleTabChange} centered>
          <Tab label="Upload Images" />
          <Tab label="Edit Questions" />
          <Tab label="Quiz" />
        </Tabs>
      </AppBar>
      <TabPanel value={tab} index={0}>
        <Upload />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <EditQuestions />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <Quiz />
      </TabPanel>
    </Container>
  );
}

export default App;
