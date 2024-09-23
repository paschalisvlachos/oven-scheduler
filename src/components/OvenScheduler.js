import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimeSlotTable from './TimeSlotTable';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function OvenScheduler() {
  const startTime = parseInt(process.env.REACT_APP_START_TIME, 10) || 6;
  const endTime = parseInt(process.env.REACT_APP_END_TIME, 10) || 22;
  const timeSlots = [];
  for (let hour = startTime; hour < endTime; hour++) {
    timeSlots.push(`${hour}:00`);
    timeSlots.push(`${hour}:30`);
  }
  const trays = Array.from({ length: 20 }, (_, index) => `Tray ${index + 1}`);

  const [foods, setFoods] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [alertMessage, setAlertMessage] = useState(''); // For showing alert messages

  useEffect(() => {
    axios.get('/api/foods')
      .then((response) => setFoods(response.data))
      .catch((error) => console.error('Error fetching foods from the database:', error));
  }, []);

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    let draggedFood = foods.find((food) => food._id === draggableId);

    let updatedSchedule = { ...schedule };

    // Extract destination tray and time index
    const [destinationTrayIndex, destinationTimeIndex] = destination.droppableId.split('-').map(Number);

    // Check if the time slots where we want to place the item can accommodate the entire duration
    let remainingDuration = draggedFood.duration;
    let destinationIndex = destinationTimeIndex;

    // Check if all slots required for the dragged food are available (i.e., no slot is full)
    while (remainingDuration > 0) {
      const currentSlotId = `${destinationTrayIndex}-${destinationIndex}`;
      const currentSlot = updatedSchedule[currentSlotId] || { items: [], usedTime: 0 };

      // If any slot in the sequence is full, show an alert and stop
      if (currentSlot.usedTime >= 30) {
        setAlertMessage(`Slot ${destinationIndex} is full! You cannot add the food item here.`);
        return; // Prevent dropping if any slot in sequence is full
      }

      const fitTime = calculateFit(remainingDuration, currentSlot.usedTime);
      remainingDuration -= fitTime;
      destinationIndex += 1;
    }

    // If all slots have enough space, proceed with dropping the food item across them
    remainingDuration = draggedFood.duration;
    destinationIndex = destinationTimeIndex;

    while (remainingDuration > 0) {
      const currentSlotId = `${destinationTrayIndex}-${destinationIndex}`;
      const currentSlot = updatedSchedule[currentSlotId] || { items: [], usedTime: 0 };

      const fitTime = calculateFit(remainingDuration, currentSlot.usedTime);
      const newItem = { ...draggedFood, duration: fitTime };

      currentSlot.items.push(newItem);
      currentSlot.usedTime += fitTime;

      updatedSchedule[currentSlotId] = currentSlot;
      remainingDuration -= fitTime;
      destinationIndex += 1;
    }

    setSchedule(updatedSchedule);
    setAlertMessage(''); // Clear any previous alerts
  };

  const calculateFit = (remainingDuration, usedTime) => {
    const availableTime = 30 - usedTime;
    return Math.min(availableTime, remainingDuration);
  };

  const removeItemFromSourceSlots = (itemId, sourceTrayIndex, sourceTimeIndex, itemDuration, updatedSchedule) => {
    let remainingDuration = itemDuration;
    let timeIndex = sourceTimeIndex;

    while (remainingDuration > 0) {
      const sourceSlotId = `${sourceTrayIndex}-${timeIndex}`;
      const sourceSlot = updatedSchedule[sourceSlotId] || { items: [] };

      sourceSlot.items = sourceSlot.items.filter(item => item._id !== itemId);

      if (sourceSlot.items.length === 0) {
        delete updatedSchedule[sourceSlotId];
      } else {
        // Subtract the duration of the removed item from the used time
        sourceSlot.usedTime -= Math.min(30, remainingDuration);
        updatedSchedule[sourceSlotId] = sourceSlot;
      }

      remainingDuration -= 30;
      timeIndex += 1;
    }
  };

  const removeFoodItem = (trayIndex, timeIndex, foodItem) => {
    const updatedSchedule = { ...schedule };
    const slotId = `${trayIndex}-${timeIndex}`;
    const slot = updatedSchedule[slotId];

    if (slot) {
      slot.items = slot.items.filter(item => item._id !== foodItem._id);

      if (slot.items.length === 0) {
        delete updatedSchedule[slotId]; // Remove empty slot
      } else {
        // Subtract the removed food's duration from the used time
        slot.usedTime -= foodItem.duration;
        updatedSchedule[slotId] = slot;
      }
    }

    setSchedule(updatedSchedule);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="food-container">
        {alertMessage && <div className="alert alert-danger">{alertMessage}</div>} {/* Alert for full slots */}
        <div className="food-list">
          <Droppable droppableId="food-list" isDropDisabled={false}>
            {(provided) => (
              <ul ref={provided.innerRef} {...provided.droppableProps}>
                {foods.map((food, index) => (
                  <Draggable key={food._id} draggableId={food._id} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="food-item"
                        style={{
                          backgroundColor: food.color,
                          ...provided.draggableProps.style,
                        }}
                      >
                        {food.title}<br />({food.duration} mins)
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </div>
        <TimeSlotTable trays={trays} timeSlots={timeSlots} schedule={schedule} removeFoodItem={removeFoodItem} />
      </div>
    </DragDropContext>
  );
}

export default OvenScheduler;
