import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimeSlotTable from './TimeSlotTable';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { formatISO, addDays, subDays, format } from 'date-fns'; // Import format for better date display

// Load start and end times from environment variables
const startTime = parseInt(process.env.REACT_APP_START_TIME) || 6;
const endTime = parseInt(process.env.REACT_APP_END_TIME) || 16;

function OvenScheduler() {
  const timeSlots = [];
  for (let hour = startTime; hour < endTime; hour++) {
    timeSlots.push(`${hour}:00`);
    timeSlots.push(`${hour}:30`);
  }

  const [foods, setFoods] = useState([]);
  const [schedule, setSchedule] = useState({ trays: Array(20).fill({ timeSlots: [] }) });
  const [alertMessage, setAlertMessage] = useState(''); // For showing alert messages
  const [currentDate, setCurrentDate] = useState(formatISO(new Date(), { representation: 'date' }));
  const [currentTimePosition, setCurrentTimePosition] = useState(null);

  useEffect(() => {
    const position = getCurrentTimeSlotPosition(timeSlots);
    setCurrentTimePosition(position);
  }, [timeSlots]);

  useEffect(() => {
    axios.get('/api/foods')
      .then((response) => setFoods(response.data))
      .catch((error) => console.error('Error fetching foods from the database:', error));

    fetchScheduleForDate(currentDate);
  }, [currentDate]);

  useEffect(() => {
    const timeSlotWidth = 100; // Ensure this matches the CSS width for time slots
  
    const updateCurrentTimePosition = () => {
      const position = getCurrentTimeSlotPosition(timeSlots, timeSlotWidth);
      setCurrentTimePosition(position);
    };
  
    updateCurrentTimePosition(); // Run on component mount
    const intervalId = setInterval(updateCurrentTimePosition, 30000); // Update every 30 seconds
  
    return () => clearInterval(intervalId); // Clean up interval on unmount
  }, [timeSlots]);           

  const fetchScheduleForDate = (date) => {
    axios.get(`/api/schedules/${date}`)
      .then((response) => {
        const fetchedSchedule = response.data || { trays: [] };
        const trays = [...Array(20)].map((_, index) => {
          return fetchedSchedule.trays[index] || { trayIndex: index, timeSlots: [] };
        });
        setSchedule({ trays });
      })
      .catch((error) => {
        console.error('Error fetching schedule:', error);
        setSchedule({ trays: Array(20).fill({ timeSlots: [] }) });
      });
  };

  const goToPreviousDate = () => setCurrentDate(prev => formatISO(subDays(new Date(prev), 1), { representation: 'date' }));
  const goToNextDate = () => setCurrentDate(prev => formatISO(addDays(new Date(prev), 1), { representation: 'date' }));

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
  
    let draggedFood = foods.find((food) => food._id === draggableId);
    if (!draggedFood) {
      console.error(`No food item found with draggableId ${draggableId}`);
      return;
    }
  
    let updatedSchedule = JSON.parse(JSON.stringify(schedule));
  
    const trayIndex = parseInt(destination.droppableId.split('-')[0]);
    const timeSlotIndex = parseInt(destination.droppableId.split('-')[1]);
  
    // Ensure the tray exists and has timeSlots initialized
    if (!updatedSchedule.trays[trayIndex]) {
      updatedSchedule.trays[trayIndex] = { trayIndex: trayIndex, timeSlots: [] };
    }
  
    // Ensure the timeSlots array is filled up to the correct index
    while (updatedSchedule.trays[trayIndex].timeSlots.length <= timeSlotIndex) {
      updatedSchedule.trays[trayIndex].timeSlots.push(null); 
    }
  
    // Check if the time slot at the current index already exists, and if not, initialize it
    let currentSlot = updatedSchedule.trays[trayIndex].timeSlots[timeSlotIndex];
  
    if (!currentSlot) {
      updatedSchedule.trays[trayIndex].timeSlots[timeSlotIndex] = {
        timeSlotIndex: timeSlotIndex,
        items: [],
        usedTime: 0,
      };
      currentSlot = updatedSchedule.trays[trayIndex].timeSlots[timeSlotIndex];
    }
  
    // If the current slot is already fully used (30 minutes), show a warning and prevent drop
    if (currentSlot.usedTime >= 30) {
      setAlertMessage('The time slot is already full with 30 minutes!');
      return;
    }
  
    // Handle multiple time slots for long duration food
    let remainingDuration = draggedFood.duration;
    let slotIndex = timeSlotIndex;
  
    while (remainingDuration > 0) {
      // Ensure the timeSlots array is large enough to accommodate the next time slots
      while (updatedSchedule.trays[trayIndex].timeSlots.length <= slotIndex) {
        updatedSchedule.trays[trayIndex].timeSlots.push(null);
      }
  
      // Initialize the current slot if needed
      if (!updatedSchedule.trays[trayIndex].timeSlots[slotIndex]) {
        updatedSchedule.trays[trayIndex].timeSlots[slotIndex] = {
          timeSlotIndex: slotIndex,
          items: [],
          usedTime: 0,
        };
      }
  
      currentSlot = updatedSchedule.trays[trayIndex].timeSlots[slotIndex];
  
      // Calculate how much time can fit in the current slot
      const availableTime = 30 - currentSlot.usedTime;
      const fitTime = Math.min(availableTime, remainingDuration);
  
      if (availableTime === 0) {
        // If the current slot is already full, show a warning and stop the drop
        setAlertMessage(`Time slot ${slotIndex} in tray ${trayIndex + 1} is already full.`);
        break;
      }
  
      // Add the portion of food that fits into the current slot
      currentSlot.items.push({ ...draggedFood, duration: fitTime });
      currentSlot.usedTime += fitTime;
      remainingDuration -= fitTime;
  
      // Move to the next time slot
      slotIndex++;
    }
  
    // Ensure no null time slots
    updatedSchedule.trays.forEach((tray) => {
      tray.timeSlots = tray.timeSlots.map((slot) => {
        if (slot === null) {
          return {
            timeSlotIndex: null,
            items: [],
            usedTime: 0,
          };
        }
        return slot;
      });
    });
  
    // Update the schedule state and save it
    setSchedule(updatedSchedule);
    saveSchedule(updatedSchedule);
  
    // Clear any previous alert if the operation was successful
    setAlertMessage('');
  };               

  const saveSchedule = (updatedSchedule) => {
    const filteredTrays = updatedSchedule.trays
      .filter(tray => tray)
      .map(tray => ({
        ...tray,
        timeSlots: tray.timeSlots.filter(slot => slot)
      }));

    axios.post(`/api/schedules/${currentDate}`, { trays: filteredTrays })
      .then(() => console.log('Schedule saved successfully'))
      .catch((error) => console.error('Error saving schedule:', error));
  };

  const calculateFit = (remainingDuration, usedTime) => {
    const availableTime = 30 - usedTime;
    return Math.min(availableTime, remainingDuration);
  };

  const removeFoodItem = (trayIndex, timeIndex, foodItem) => {
    const updatedSchedule = JSON.parse(JSON.stringify(schedule)); // Deep copy to avoid direct mutation
  
    const tray = updatedSchedule.trays[trayIndex];
    const slot = tray?.timeSlots[timeIndex];
  
    // Check if the tray or time slot exists
    if (!tray || !slot) {
      console.error('Tray or time slot not found');
      setAlertMessage('Tray or time slot not found');
      return;
    }
  
    // Find the food item in the time slot
    const foodItemIndex = slot.items.findIndex(item => item._id === foodItem._id);
    if (foodItemIndex === -1) {
      console.error('Food item not found in time slot');
      setAlertMessage('Food item not found in time slot');
      return;
    }
  
    // Remove the item and update usedTime
    const removedDuration = slot.items[foodItemIndex].duration;
    slot.usedTime -= removedDuration;  // Decrease the used time
    slot.items.splice(foodItemIndex, 1); // Remove the food item
  
    // If no items remain in the time slot, reset it
    if (slot.items.length === 0) {
      updatedSchedule.trays[trayIndex].timeSlots[timeIndex] = {
        timeSlotIndex: timeIndex,  // Keep the valid timeSlotIndex
        items: [],                 // Empty items array
        usedTime: 0,               // Reset used time to 0
      };
    }
  
    // Update the schedule state with the modified schedule
    setSchedule(updatedSchedule);
  
    // Log the updated schedule to inspect its structure after item removal
    console.log('Updated schedule after removal:', JSON.stringify(updatedSchedule, null, 2));
  
    // Save the updated schedule
    saveSchedule(updatedSchedule);
  
    // Set an alert for successful deletion and clear it after 5 seconds
    setAlertMessage('Item successfully removed');
    setTimeout(() => setAlertMessage(''), 5000); // Clear alert after 5 seconds
  };             

  function getCurrentTimeSlotPosition(timeSlots, timeSlotWidth) {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
  
    // Total minutes since the start of the day
    const totalMinutesInDay = currentHour * 60 + currentMinutes;
  
    // Define the start time of the schedule (6:00 AM)
    const startTimeInMinutes = 6 * 60; // 6:00 AM = 360 minutes
  
    // Calculate how many minutes have passed since 6:00 AM
    const totalElapsedMinutes = totalMinutesInDay - startTimeInMinutes;
  
    // If the current time is before 6:00 AM, return the first slot with no offset
    if (totalElapsedMinutes < 0) {
      return { slotIndex: 0, offsetPixels: 0 };
    }
  
    // Calculate which 30-minute time slot we're in
    const slotIndex = Math.floor(totalElapsedMinutes / 30);
  
    // Calculate how many minutes have passed within the current 30-minute slot
    const minutesSinceSlotStart = totalElapsedMinutes % 30;
  
    // Convert the minutes within the slot to a pixel offset based on the time slot width
    const offsetPixels = (minutesSinceSlotStart / 30) * timeSlotWidth;
  
    // Return both the time slot index and the pixel offset for accurate positioning
    return { slotIndex: slotIndex + 1, offsetPixels };
  }                 

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="container">
        <div className="row justify-content-center my-3">
          <div className="col-auto">
            <button className="btn btn-outline-secondary" onClick={goToPreviousDate}>
              <i className="bi bi-chevron-left"></i> {/* Bootstrap icon */}
            </button>
          </div>
          <div className="col-auto">
            <h4>{format(new Date(currentDate), 'MMMM dd, yyyy')}</h4> {/* Format the date */}
          </div>
          <div className="col-auto">
            <button className="btn btn-outline-secondary" onClick={goToNextDate}>
              <i className="bi bi-chevron-right"></i> {/* Bootstrap icon */}
            </button>
          </div>
        </div>

        <div className="food-container">
          {alertMessage && <div className="alert alert-danger">{alertMessage}</div>}
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
          <div className="oven-scheduler-container">
          <TimeSlotTable
            trays={schedule.trays}
            timeSlots={timeSlots}
            removeFoodItem={removeFoodItem}
            currentTimePosition={currentTimePosition} // Pass the current time position
          />
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}

export default OvenScheduler;
