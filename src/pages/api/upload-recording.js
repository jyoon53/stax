// src/pages/api/upload-recording.js
import nextConnect from "next-connect";
import multer from "multer";

const upload = multer({ dest: "./uploads" });

const apiRoute = nextConnect({
  onError(error, req, res) {
    res
      .status(501)
      .json({ error: `Sorry something happened! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

apiRoute.use(upload.single("video"));

apiRoute.post((req, res) => {
  // Simulate video processing and lesson plan generation
  const simulatedLessonPlan = {
    lessonID: 1,
    chapters: [
      { title: "Room A", clipUrl: "http://example.com/clipA.mp4" },
      { title: "Room B", clipUrl: "http://example.com/clipB.mp4" },
    ],
  };
  res.status(200).json(simulatedLessonPlan);
});

export default apiRoute;

export const config = {
  api: {
    bodyParser: false,
  },
};
