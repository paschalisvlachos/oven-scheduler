const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  date: { type: String, required: true },
  trays: [
    {
      trayIndex: Number, // Tray index
      timeSlots: [
        {
          timeSlotIndex: Number, // Time slot index
          items: [
            {
              title: String,
              duration: Number,
              color: String,
            },
          ],
          usedTime: Number, // Track how much time is used in the slot
        },
      ],
    },
  ],
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
