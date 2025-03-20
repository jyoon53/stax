export default function handler(req, res) {
  // Simulated lessons data with exercises
  const lessons = [
    {
      id: 1,
      title: "Introduction to Roblox Scripting",
      description: "Learn the basics of scripting in Roblox.",
      exercises: [
        { id: 101, title: "Exercise 1: Print Statements", completed: false },
        { id: 102, title: "Exercise 2: Variables", completed: true },
      ],
    },
    {
      id: 2,
      title: "Game Design Fundamentals",
      description: "Understand core principles of game design in Roblox.",
      exercises: [
        { id: 201, title: "Exercise 1: Creating a Level", completed: false },
        { id: 202, title: "Exercise 2: Level Layout", completed: false },
      ],
    },
  ];
  res.status(200).json(lessons);
}
