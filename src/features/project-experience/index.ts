/**
 * Public surface of the experience feature.
 *
 * The stage route consumes `ProjectStage` and nothing else. The registry is
 * exported only for `scripts/validate-content.ts`, which has to know which ids
 * exist in order to refuse a manifest that names one that does not.
 */

export { ProjectStage } from './components/ProjectStage'
export {
  registeredExperienceIds,
  resolveProjectExperience,
  type ProjectExperienceProps,
} from './registry/experiences'
