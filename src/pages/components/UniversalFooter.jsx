import { database } from "firebase-admin";
import { draftMode } from "next/headers";
import { addSyntheticLeadingComment, getAllJSDocTagsOfKind } from "typescript";

export default function UniversalFooter() {
  return (
    <footer className="bg-gray-50 py-4 text-center text-gray-500">
      © {new Date().getFullYear()} Stax LMS. All rights reserved.
    </footer>
  );
}
