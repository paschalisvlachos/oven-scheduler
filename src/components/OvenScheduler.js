import React, { useState } from 'react';
import TimeSlotTable from './TimeSlotTable';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function OvenScheduler() {
  // Time slots: 6 AM to 10 PM in 30-minute intervals
  const timeSlots = [];
  for (let hour = 6; hour < 22; hour++) {
    timeSlots.push(`${hour}:00`);
    timeSlots.push(`${hour}:30`);
  }

  // Create an array for 20 trays
  const trays = Array.from({ length: 20 }, (_, index) => `Tray ${index + 1}`);

  // Define the list of available foods
  const [foods, setFoods] = useState([
    { id: '1', title: 'Pizza', duration: 60, color: 'red' },
    { id: '2', title: 'Cake', duration: 90, color: 'blue' },
    { id: '3', title: 'Cookies', duration: 15, color: 'green' },
    { id: '4', title: 'Sandwich', duration: 5, color: 'yellow' },
  ]);

  const [schedule, setSchedule] = useState({});

  // Function to calculate how much of the duration can fit in the current slot
  const calculateFit = (remainingDuration, usedTime) => {
    const availableTime = 30 - usedTime;
    return Math.min(availableTime, remainingDuration);
  };

  // Function to remove an item from all the slots it occupies
  const removeItemFromSourceSlots = (itemId, sourceTrayIndex, sourceTimeIndex, itemDuration, updatedSchedule) => {
    let remainingDuration = itemDuration;
    let timeIndex = sourceTimeIndex;

    // Loop through all slots that the item occupies and remove it
    while (remainingDuration > 0) {
      const sourceSlotId = `${sourceTrayIndex}-${timeIndex}`;
      const sourceSlot = updatedSchedule[sourceSlotId] || { items: [] };

      // Remove the item from the current slot
      sourceSlot.items = sourceSlot.items.filter(item => item.id !== itemId);

      if (sourceSlot.items.length === 0) {
        delete updatedSchedule[sourceSlotId]; // Delete slot if empty
      } else {
        updatedSchedule[sourceSlotId] = sourceSlot;
      }

      remainingDuration -= 30; // Each slot represents 30 minutes
      timeIndex += 1; // Move to the next time slot
    }
  };

  // Handle drag-and-drop events
  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return; // Drop was outside the grid

    // If the item was dropped in the same place, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Find the dragged food item (either from the available foods list or from the schedule)
    let draggedFood = foods.find((food) => food.id === draggableId) || findDraggedFoodInSchedule(draggableId, schedule);

    // Create a copy of the schedule to update immutably
    let updatedSchedule = { ...schedule };

    // Remove the item from the source slots if it was moved from within the grid
    if (source.droppableId !== 'food-list') {
      const [sourceTrayIndex, sourceTimeIndex] = source.droppableId.split('-').map(Number);
      removeItemFromSourceSlots(draggedFood.id, sourceTrayIndex, sourceTimeIndex, draggedFood.duration, updatedSchedule);
    }

    // Place the item in the destination slot(s)
    let remainingDuration = draggedFood.duration;
    let [destinationTrayIndex, destinationTimeIndex] = destination.droppableId.split('-').map(Number);

    while (remainingDuration > 0) {
      const destinationSlotId = `${destinationTrayIndex}-${destinationTimeIndex}`;
      const currentSlot = updatedSchedule[destinationSlotId] || { items: [], usedTime: 0 };

      // Calculate how much time can fit in the current slot
      const fitTime = calculateFit(remainingDuration, currentSlot.usedTime);
      const newItem = { ...draggedFood, duration: fitTime };

      // Add the item to the slot
      currentSlot.items.push(newItem);
      currentSlot.usedTime += fitTime;

      // Update the schedule
      updatedSchedule[destinationSlotId] = currentSlot;

      // Subtract the fitted time from the remaining duration
      remainingDuration -= fitTime;

      // Move to the next slot if necessary
      destinationTimeIndex += 1;
    }

    // Update the schedule state
    setSchedule(updatedSchedule);
  };

  // Helper function to find the dragged food in the schedule
  const findDraggedFoodInSchedule = (draggableId, schedule) => {
    for (let slot in schedule) {
      const slotItems = schedule[slot].items || [];
      const foundItem = slotItems.find(item => item.id === draggableId);
      if (foundItem) return foundItem;
    }
    return null;
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="oven-scheduler">
        <h1>Oven Scheduler</h1>
        <TimeSlotTable trays={trays} timeSlots={timeSlots} schedule={schedule} />
        <div className="food-list">
          <h2>Available Foods</h2>
          <Droppable droppableId="food-list" isDropDisabled={true}>
            {(provided) => (
              <ul ref={provided.innerRef} {...provided.droppableProps}>
                {foods.map((food, index) => (
                  <Draggable key={food.id} draggableId={food.id} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          backgroundColor: food.color,
                          padding: '10px',
                          margin: '5px 0',
                          borderRadius: '4px',
                          width: `${(food.duration / 30) * 100}px`, // Dynamic width based on duration
                          ...provided.draggableProps.style,
                        }}
                      >
                        {food.title} ({food.duration} mins)
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </div>
      </div>
    </DragDropContext>
  );
}

export default OvenScheduler;
