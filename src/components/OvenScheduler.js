import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimeSlotTable from './TimeSlotTable';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function OvenScheduler() {
  // Get start and end times from environment variables
  const startTime = parseInt(process.env.REACT_APP_START_TIME, 10) || 6;
  const endTime = parseInt(process.env.REACT_APP_END_TIME, 10) || 22;

  // Time slots: from startTime to endTime in 30-minute intervals
  const timeSlots = [];
  for (let hour = startTime; hour < endTime; hour++) {
    timeSlots.push(`${hour}:00`);
    timeSlots.push(`${hour}:30`);
  }

  // Create an array for 20 trays
  const trays = Array.from({ length: 20 }, (_, index) => `Tray ${index + 1}`);

  // State to hold the food items fetched from the database
  const [foods, setFoods] = useState([]);
  const [schedule, setSchedule] = useState({});

  // Fetch food items from the database
  useEffect(() => {
    axios.get('/api/foods')
      .then((response) => setFoods(response.data))
      .catch((error) => console.error('Error fetching foods from the database:', error));
  }, []);

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
        updatedSchedule[sourceSlotId] = sourceSlot;
      }

      remainingDuration -= 30;
      timeIndex += 1;
    }
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Find the dragged food by _id
    let draggedFood = foods.find((food) => food._id === draggableId) || findDraggedFoodInSchedule(draggableId, schedule);

    let updatedSchedule = { ...schedule };

    // If the item was moved from within the grid, remove it from the original slot
    if (source.droppableId !== 'food-list') {
      const [sourceTrayIndex, sourceTimeIndex] = source.droppableId.split('-').map(Number);
      removeItemFromSourceSlots(draggedFood._id, sourceTrayIndex, sourceTimeIndex, draggedFood.duration, updatedSchedule);
    }

    let remainingDuration = draggedFood.duration;
    let [destinationTrayIndex, destinationTimeIndex] = destination.droppableId.split('-').map(Number);

    while (remainingDuration > 0) {
      const destinationSlotId = `${destinationTrayIndex}-${destinationTimeIndex}`;
      const currentSlot = updatedSchedule[destinationSlotId] || { items: [], usedTime: 0 };

      const fitTime = calculateFit(remainingDuration, currentSlot.usedTime);
      const newItem = { ...draggedFood, duration: fitTime };

      currentSlot.items.push(newItem);
      currentSlot.usedTime += fitTime;

      updatedSchedule[destinationSlotId] = currentSlot;
      remainingDuration -= fitTime;
      destinationTimeIndex += 1;
    }

    setSchedule(updatedSchedule);
  };

  const findDraggedFoodInSchedule = (draggableId, schedule) => {
    for (let slot in schedule) {
      const slotItems = schedule[slot].items || [];
      const foundItem = slotItems.find(item => item._id === draggableId);
      if (foundItem) return foundItem;
    }
    return null;
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="food-container">
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
        <TimeSlotTable trays={trays} timeSlots={timeSlots} schedule={schedule} />
      </div>
    </DragDropContext>
  );
}

export default OvenScheduler;
