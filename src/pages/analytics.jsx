// src/pages/analytics.jsx
export default function Analytics() {
  return (
    <div className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">
        Stax - Learning Data Analytics
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overview Cards */}
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-2xl font-semibold mb-2">Total Lesson Hours</h2>
          <p className="text-3xl font-bold">120</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-2xl font-semibold mb-2">Active Students</h2>
          <p className="text-3xl font-bold">150</p>
        </div>
        {/* Performance Comparison */}
        <div className="p-4 bg-white rounded shadow col-span-1 md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">
            Performance Comparison
          </h2>
          <div className="flex justify-around">
            <div>
              <p className="text-lg">Learning Progress</p>
              <p className="font-bold">12%</p>
            </div>
            <div>
              <p className="text-lg">Skill Development</p>
              <p className="font-bold">7.2%</p>
            </div>
            <div>
              <p className="text-lg">Course Completion</p>
              <p className="font-bold">25%</p>
            </div>
          </div>
        </div>
        {/* Total Lesson Hours Graph */}
        <div className="p-4 bg-white rounded shadow col-span-1 md:col-span-2">
          <h2 className="text-2xl font-semibold mb-2">
            Total Lesson Hours (Weekly)
          </h2>
          <div className="h-64 flex items-center justify-center">
            {/* Placeholder for bar chart */}
            <p className="text-lg">[Bar Chart Placeholder]</p>
          </div>
        </div>
      </div>
    </div>
  );
}
