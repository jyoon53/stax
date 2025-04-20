// pages/api/getRoomEvents.js
export default function handler(req, res) {
  res.status(200).json([
    { eventType: "RoomEntrance", timestamp: 2 },
    { eventType: "RoomExit", timestamp: 7 },
  ]);
}
