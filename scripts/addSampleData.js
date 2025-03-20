// scripts/addSampleData.js

const admin = require("firebase-admin");
const serviceAccount = require("../credentials/serviceAccountKey.json");

// Initialize the Firebase Admin SDK with your service account credentials.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Get a Firestore reference.
const db = admin.firestore();
// Connect to emulator
if (process.env.FIRESTORE_EMULATOR_HOST) {
  db.settings({
    host: process.env.FIRESTORE_EMULATOR_HOST,
    ssl: false,
  });
}

async function addSampleData() {
  try {
    // 1. Create a lesson document
    const lessonRef = db.collection("lessons").doc("lesson_001");
    await lessonRef.set({
      lesson_id: "lesson_001",
      title: "Introduction to Roblox Scripting",
      description: "Learn the basics of scripting in Roblox.",
      createdAt: new Date().toISOString(),
    });
    console.log("Lesson created");

    // 2. Create an exercise in a subcollection under the lesson
    const exerciseRef = lessonRef.collection("exercises").doc("ex_001");
    await exerciseRef.set({
      exercise_id: "ex_001",
      title: "Print Statements",
      details: "Use print() to output text in Roblox scripting.",
    });
    console.log("Exercise created");

    // 3. Create a progress document in a separate collection
    const progressRef = db.collection("progress").doc();
    await progressRef.set({
      student_id: "Student123",
      lesson_id: "lesson_001",
      exercise_id: "ex_001",
      startTime: 1677000000,
      endTime: 1677000300,
      duration: 300,
      score: 95,
      additionalData: {
        hintsUsed: 1,
      },
    });
    console.log("Progress data created");

    console.log("Sample data added successfully!");
  } catch (error) {
    console.error("Error adding sample data:", error);
  }
}

addSampleData();
