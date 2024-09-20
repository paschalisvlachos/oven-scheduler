const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/oven-scheduler', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Food schema
const foodSchema = new mongoose.Schema({
  title: String,
  duration: Number,
  color: String
});
const Food = mongoose.model('Food', foodSchema);

// API routes
app.get('/api/foods', async (req, res) => {
  const foods = await Food.find();
  res.json(foods);
});

app.post('/api/foods', async (req, res) => {
  const { title, duration, color } = req.body;
  const newFood = new Food({ title, duration, color });
  await newFood.save();
  res.json(newFood);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
