import {
  RequirementMasterModel
} from "../models/RequirementMaster";

import {
  UserStoryModel
} from "../models/UserStory";

import {
  generateUserStories
} from "./user-story-generator.service";

export const createUserStories =
async (
  requirementMasterId: string
) => {

  const requirement: any =
    await RequirementMasterModel.findById(
      requirementMasterId
    );

  if (!requirement) {
    throw new Error(
      "Requirement not found"
    );
  }

  const result =
    await generateUserStories(
      requirement.refinedRequirement || ""
    );

  const stories = [];

  for (
    const story
    of result.stories || []
  ) {

    const created =
      await UserStoryModel.create({
        requirementMasterId,

        title:
          story.title,

        actor:
          story.actor,

        action:
          story.action,

        benefit:
          story.benefit
      });

    stories.push(
      created
    );
  }

  return stories;
};