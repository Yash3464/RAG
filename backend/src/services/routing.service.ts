import { MeetingNoteModel } from "../models/MeetingNote";
import { DecisionModel } from "../models/Decision";
import { BusinessRuleModel } from "../models/BusinessRule";
import { TaskModel } from "../models/Task";
import { ChangeRequestModel } from "../models/ChangeRequest";
import { RequirementModel } from "../models/Requirement";

export const routeContent =
async (
  journalId: string,
  content: string,
  type: string
) => {

  switch (type) {

    case "meeting_note":
      return MeetingNoteModel.create({
        journalId,
        content
      });

    case "decision":
      return DecisionModel.create({
        journalId,
        decision: content
      });

    case "business_rule":
      return BusinessRuleModel.create({
        journalId,
        rule: content
      });

    case "task":
      // Defer backlog task creation until review is finalized/approved.
      return null;

    case "change_request":
      return ChangeRequestModel.create({
        journalId,
        description: content
      });

    case "requirement":
        return RequirementModel.create({
            title: content,
            refinedRequirement: content,
            assumptions: [],
            dependencies: [],
            businessRules: [],
            status: "draft"
        });

    default:
      return null;
  }
};