// src/pages/calendar.jsx
export default function Calendar() {
  const events = [
    { date: "2025-02-22", title: "Game Design Workshop", time: "10:00 AM" },
    { date: "2025-02-23", title: "Programming Challenge", time: "2:00 PM" },
    { date: "2025-02-24", title: "Student Progress Meeting", time: "1:00 PM" },
  ];

  return (
    <div className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">Stax - Calendar</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((event, index) => (
          <div key={index} className="p-4 bg-softPink rounded shadow">
            <h3 className="text-xl font-semibold">{event.title}</h3>
            <p>
              {event.date} at {event.time}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
