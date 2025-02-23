// src/pages/lesson-planner.jsx
import { useState } from "react";

export default function LessonPlanner() {
  const [step, setStep] = useState(1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Step 1: Record Lesson
            </h2>
            <p className="mb-4">
              Record your full Roblox walkthrough. Ensure you cover all the
              rooms/chapters.
            </p>
            <button
              onClick={() => setStep(2)}
              className="bg-primary hover:bg-accent text-white py-2 px-4 rounded"
            >
              Next: Process Video
            </button>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Step 2: Process Video
            </h2>
            <p className="mb-4">
              Our system will automatically analyze the recording, detect room
              transitions, and extract chapter titles.
            </p>
            <button
              onClick={() => setStep(3)}
              className="bg-primary hover:bg-accent text-white py-2 px-4 rounded"
            >
              Next: Generate Plan
            </button>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Step 3: Generate Lesson Plan
            </h2>
            <p className="mb-4">
              Review the auto-detected chapters, adjust if necessary, and
              publish your structured lesson plan.
            </p>
            <button
              onClick={() => alert("Lesson Plan Generated!")}
              className="bg-primary hover:bg-accent text-white py-2 px-4 rounded"
            >
              Generate Plan
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">Stax - Lesson Planner</h1>
      <div className="p-4 bg-white rounded shadow">{renderStep()}</div>
    </div>
  );
}
