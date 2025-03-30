// pages/api/processRoomVideo.js
import formidable from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "File upload error" });
    }

    const roomLogs = fields.roomLogs;
    const file = files.video;
    if (!file) {
      return res.status(400).json({ error: "No video file" });
    }

    try {
      // read file into memory
      const fileBuffer = fs.readFileSync(file.filepath);

      // Construct a multipart request to Python
      const boundary = "----BoundaryForPython";
      const bodyParts = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="roomLogs"`,
        "",
        roomLogs,
        `--${boundary}`,
        `Content-Disposition: form-data; name="file"; filename="${file.originalFilename}"`,
        "Content-Type: application/octet-stream",
        "",
        fileBuffer,
        `--${boundary}--`,
        "",
      ];
      const multipartBody = Buffer.from(bodyParts.join("\r\n"));

      const pythonRes = await fetch("http://localhost:8000/clip-room-video", {
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body: multipartBody,
      });

      const data = await pythonRes.json();
      if (!data.success) {
        return res.status(500).json({ error: data.error });
      }
      res.status(200).json({
        success: true,
        start: data.start,
        end: data.end,
        savedFile: data.savedFile,
        totalDuration: data.totalDuration,
      });
    } catch (error) {
      console.error("Error sending file to python microservice:", error);
      res.status(500).json({ error: "Video processing failed" });
    } finally {
      fs.unlink(file.filepath, () => {});
    }
  });
}
