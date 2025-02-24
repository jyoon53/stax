// src/pages/settings.jsx
import { useState } from "react";
import Link from "next/link";

export default function Settings() {
  const [collaborators, setCollaborators] = useState([
    { name: "John Doe", role: "Instructor" },
    { name: "Alice Smith", role: "Assistant" },
    { name: "Ethan Brown", role: "Developer" },
  ]);
  const [newCollaborator, setNewCollaborator] = useState("");
  const [privacy, setPrivacy] = useState("Public");

  const addCollaborator = () => {
    if (newCollaborator.trim()) {
      setCollaborators([
        ...collaborators,
        { name: newCollaborator.trim(), role: "Instructor" },
      ]);
      setNewCollaborator("");
    }
  };

  return (
    <div className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">Stax - Settings</h1>

      <section className="mb-8 p-4 bg-lightGray rounded">
        <h2 className="text-2xl font-semibold mb-4">Collaborators</h2>
        <ul className="list-disc ml-6 mb-4">
          {collaborators.map((col, index) => (
            <li key={index}>
              {col.name}{" "}
              <span className="text-sm text-darkGray">({col.role})</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Add collaborator by Roblox username"
            value={newCollaborator}
            onChange={(e) => setNewCollaborator(e.target.value)}
            className="border border-gray-300 rounded p-2 mr-2 w-full"
          />
          <button
            onClick={addCollaborator}
            className="bg-primary hover:bg-accent text-white py-2 px-4 rounded"
          >
            Add
          </button>
        </div>
      </section>

      <section className="mb-8 p-4 bg-lightGray rounded">
        <h2 className="text-2xl font-semibold mb-4">Premium Features</h2>
        <p className="mb-4">
          Unlock advanced analytics, unlimited video storage, and more!
        </p>
        <button className="bg-primary hover:bg-accent text-white py-2 px-4 rounded">
          Upgrade Plan
        </button>
      </section>

      <section className="mb-8 p-4 bg-lightGray rounded">
        <h2 className="text-2xl font-semibold mb-4">Privacy Settings</h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="privacy"
              value="Public"
              checked={privacy === "Public"}
              onChange={() => setPrivacy("Public")}
              className="mr-2"
            />
            Public
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="privacy"
              value="Private"
              checked={privacy === "Private"}
              onChange={() => setPrivacy("Private")}
              className="mr-2"
            />
            Private
          </label>
        </div>
      </section>

      <section className="p-4 bg-lightGray rounded">
        <h2 className="text-2xl font-semibold mb-4">Workspace Management</h2>
        <button className="bg-gray-700 hover:bg-gray-800 text-white py-2 px-4 rounded">
          Delete Workspace
        </button>
      </section>
    </div>
  );
}
