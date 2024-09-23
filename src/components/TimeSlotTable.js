import React from 'react';
import { Droppable } from 'react-beautiful-dnd';

function TimeSlotTable({ trays, timeSlots, schedule }) {
  return (
    <table className="oven-scheduler">
      <thead>
        <tr>
          <th className="tray-column">Tray</th> {/* Tray column with distinct width */}
          {timeSlots.map((time, index) => (
            <th key={index} className="time-slot-column">{time}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {trays.map((tray, trayIndex) => (
          <tr key={trayIndex}>
            <td className="tray-column">{tray}</td> {/* Tray column */}
            {timeSlots.map((_, timeIndex) => {
              const slotId = `${trayIndex}-${timeIndex}`;
              const slot = schedule[slotId];

              return (
                <td key={timeIndex} className="time-slot-column time-slot"> {/* Time slot column */}
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
                            title={`${item.title} (${item.duration} mins)`}
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
