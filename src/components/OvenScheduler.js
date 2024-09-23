import React, { useState } from 'react';
import TimeSlotTable from './TimeSlotTable';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function OvenScheduler() {
  // Get start and end times from environment variables
  const startTime = parseInt(process.env.REACT_APP_START_TIME, 10) || 6; // Fallback to 6 if not set
  const endTime = parseInt(process.env.REACT_APP_END_TIME, 10) || 22; // Fallback to 22 if not set

  // Time slots: from startTime to endTime in 30-minute intervals
  const timeSlots = [];
  for (let hour = startTime; hour < endTime; hour++) {
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

      sourceSlot.items = sourceSlot.items.filter(item => item.id !== itemId);

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

    let draggedFood = foods.find((food) => food.id === draggableId) || findDraggedFoodInSchedule(draggableId, schedule);

    let updatedSchedule = { ...schedule };

    if (source.droppableId !== 'food-list') {
      const [sourceTrayIndex, sourceTimeIndex] = source.droppableId.split('-').map(Number);
      removeItemFromSourceSlots(draggedFood.id, sourceTrayIndex, sourceTimeIndex, draggedFood.duration, updatedSchedule);
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
      const foundItem = slotItems.find(item => item.id === draggableId);
      if (foundItem) return foundItem;
    }
    return null;
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="food-container">
        <h1>Oven Scheduler</h1>
        <div className="food-list">
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
                        className="food-item"
                        style={{
                          backgroundColor: food.color,
                          ...provided.draggableProps.style,
                        }}
                      >
                        {food.title}<br></br>({food.duration} mins)
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
