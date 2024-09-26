const mongoose = require('mongoose'); // Ensure mongoose is required

const foodSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: Number, required: true },
  color: { type: String, required: true },
});

const Food = mongoose.model('Food', foodSchema);

module.exports = Food; // Export the Food model