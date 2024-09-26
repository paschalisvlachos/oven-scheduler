const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const Food = require('./models/foodSchema');     
const Schedule = require('./models/scheduleSchema'); 

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ovenScheduler')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Routes
// Get all foods
app.get('/api/foods', async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching foods', error });
  }
});

// Add a new food
app.post('/api/foods', async (req, res) => {
  try {
    const newFood = new Food(req.body);
    await newFood.save();
    res.json(newFood);
  } catch (error) {
    res.status(500).json({ message: 'Error adding food', error });
  }
});

// Edit food (by ID)
app.put('/api/foods/:id', async (req, res) => {
  try {
    const updatedFood = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedFood);
  } catch (error) {
    res.status(500).json({ message: 'Error updating food', error });
  }
});

// Delete food (by ID)
app.delete('/api/foods/:id', async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);
    res.json({ message: 'Food deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting food', error });
  }
});

// Get schedule by date
app.get('/api/schedules/:date', async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ date: req.params.date });

    if (schedule) {
      res.json(schedule);
    } else {
      res.status(404).json({ message: 'No schedule found for this date' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedule', error });
  }
});

// Create or update schedule for a date
app.post('/api/schedules/:date', async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndUpdate(
      { date: req.params.date },
      req.body,
      { new: true, upsert: true } // Create new if doesn't exist
    );
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error saving schedule', error });
  }
});

// Start the server
const port = 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
