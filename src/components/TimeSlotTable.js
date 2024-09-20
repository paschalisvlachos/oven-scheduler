import React from 'react';
import { Droppable } from 'react-beautiful-dnd';

function TimeSlotTable({ trays, timeSlots, schedule }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Tray</th>
          {timeSlots.map((time, index) => (
            <th key={index}>{time}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {trays.map((tray, trayIndex) => (
          <tr key={trayIndex}>
            <td>{tray}</td>
            {timeSlots.map((_, timeIndex) => {
              const slotId = `${trayIndex}-${timeIndex}`;
              const slot = schedule[slotId];

              return (
                <td key={timeIndex} className="time-slot">
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
                        {/* Render multiple food items in the slot */}
                        {slot?.items.map((item, index) => (
                          <div
                            key={index}
                            title={`${item.title} (${item.duration} mins)`} // Tooltip with title and duration
                            style={{
                              backgroundColor: item.color,
                              width: `${(item.duration / 30) * 100}%`,
                              padding: '5px',
                              borderRadius: '4px',
                              height: '100%',
                              boxSizing: 'border-box',
                            }}
                          ></div>
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
