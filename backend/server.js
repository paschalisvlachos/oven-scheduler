const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/ovenScheduler')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Could not connect to MongoDB', err));

// Food Schema
const foodSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: Number, required: true },
  color: { type: String, required: true },
});

const Food = mongoose.model('Food', foodSchema);

// API Routes
// GET: Fetch all food items
app.get('/api/foods', async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching foods', error: err });
  }
});

// POST: Add a new food item
app.post('/api/foods', async (req, res) => {
  try {
    const newFood = new Food(req.body);
    await newFood.save();
    res.json(newFood);
  } catch (err) {
    res.status(500).json({ message: 'Error adding food', error: err });
  }
});

// PUT: Edit a food item
app.put('/api/foods/:id', async (req, res) => {
    try {
      const updatedFood = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updatedFood);
    } catch (err) {
      res.status(500).json({ message: 'Error updating food', error: err });
    }
  });
  
  // DELETE: Delete a food item
  app.delete('/api/foods/:id', async (req, res) => {
    try {
      await Food.findByIdAndDelete(req.params.id);
      res.json({ message: 'Food deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting food', error: err });
    }
  });  

// Start Server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
