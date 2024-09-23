import React from 'react';
import { Droppable } from 'react-beautiful-dnd';

function TimeSlotTable({ trays, timeSlots, schedule, removeFoodItem }) {
  return (
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
        {trays.map((tray, trayIndex) => (
          <tr key={trayIndex}>
            <td className="tray-column">{tray}</td>
            {timeSlots.map((_, timeIndex) => {
              const slotId = `${trayIndex}-${timeIndex}`;
              const slot = schedule[slotId];

              return (
                <td key={timeIndex} className="time-slot-column time-slot">
                  <Droppable droppableId={slotId}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          minHeight: '50px',
                          display: 'flex',
                          gap: '5px',
                        }}
                      >
                        {slot?.items.map((item, index) => (
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
                            {/* Remove Button */}
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
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TimeSlotTable;
