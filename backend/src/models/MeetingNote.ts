import mongoose from "mongoose";

const meetingNoteSchema =
  new mongoose.Schema(
    {
      journalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JournalEntry"
      },

      content: {
        type: String,
        required: true
      },

      status: {
        type: String,
        default: "active"
      }
    },
    {
      timestamps: true
    }
  );

export const MeetingNoteModel =
  mongoose.model(
    "MeetingNote",
    meetingNoteSchema
  );