import React from 'react';
import { Droppable } from 'react-beautiful-dnd';

function TimeSlotTable({ trays, timeSlots, removeFoodItem, currentTimePosition, timeSlotWidth = 100 }) {
  return (
    <div style={{ position: "relative" }}>
      {currentTimePosition && (
        <div
          className="current-time-line"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            // Correctly position the red line based on the slot and offset
            left: `${currentTimePosition.slotIndex * timeSlotWidth + currentTimePosition.offsetPixels}px`,
            width: "2px",
            backgroundColor: "red",
            zIndex: 2,
            transition: "left 30s linear", // Smooth real-time transition
          }}
        />
      )}
      <table className="oven-scheduler">
        <thead>
          <tr>
            <th className="tray-column">Tray</th>
            {timeSlots.map((time, index) => (
              <th key={index} className="time-slot-column">{time}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trays.map((tray, trayIndex) => {
            const filledTimeSlots = Array(timeSlots.length).fill(null);
            tray.timeSlots?.forEach(slot => {
              if (slot.timeSlotIndex >= 0 && slot.timeSlotIndex < timeSlots.length) {
                filledTimeSlots[slot.timeSlotIndex] = slot;
              }
            });

            return (
              <tr key={trayIndex}>
                <td className="tray-column">Tray {tray.trayIndex || trayIndex + 1}</td>
                {filledTimeSlots.map((slot, timeIndex) => (
                  <td key={timeIndex} className="time-slot-column time-slot">
                    <Droppable droppableId={`${trayIndex}-${timeIndex}`}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            minHeight: '50px',
                            display: 'flex',
                            gap: '5px',
                            position: 'relative',
                          }}
                        >
                          {slot && slot.items ? (
                            slot.items.map((item, index) => (
                              <div
                                key={index}
                                style={{
                                  backgroundColor: item.color,
                                  width: `${(item.duration / 30) * 100}%`,
                                  padding: '5px',
                                  borderRadius: '4px',
                                  position: 'relative',
                                }}
                              >
                                {item.title} ({item.duration} mins)
                                <button
                                  style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    backgroundColor: 'red',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => removeFoodItem(trayIndex, timeIndex, item)}
                                >
                                  X
                                </button>
                              </div>
                            ))
                          ) : (
                            <div style={{ flexGrow: 1 }}></div>
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TimeSlotTable;