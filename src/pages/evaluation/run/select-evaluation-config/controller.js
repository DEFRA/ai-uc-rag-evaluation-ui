import { statusCodes } from '../../../../constants/status-codes.js'
import { config } from '../../../../config/config.js'
import * as evaluationService from '../../../../rag-evaluation/evaluation-service.js'
import { getGroups, getSnapshots } from '../../../group/service.js'
import { listTruthSources } from '../../../../truth/truth-service.js'

const templatePath = 'evaluation/run/select-evaluation-config/page.njk'
const judgeModels = config.get('judge_models')

function buildRubrics (payload, count) {
  const rubrics = []
  for (let i = 0; i < count; i++) {
    rubrics.push(payload[`rubric_${i}`] || '')
  }
  return rubrics
}

async function loadContext (groupId, payload) {
  const count = Number.parseInt(payload.rubric_count, 10) || 1

  const [groups, snapshotsResult, truthData] = await Promise.all([
    getGroups(),
    getSnapshots(groupId),
    listTruthSources()
  ])

  return {
    group: groups.find(g => g.groupId === groupId),
    snapshots: snapshotsResult,
    truthSources: truthData.sources.filter(s => s.dataset_id === groupId),
    groupId,
    snapshotId: payload.snapshot_id || '',
    truthSourceId: payload.truth_source_id || '',
    rubrics: buildRubrics(payload, count),
    judgeModels,
    selectedModels: [payload.models || []].flat()
  }
}

async function getConfigureForm (request, h) {
  const { groupId } = request.params
  const context = await loadContext(groupId, { rubric_count: 1, rubric_0: '' })
  return h.view(templatePath, { ...context, errors: {} }).code(statusCodes.HTTP_STATUS_OK)
}

async function handleAddRubric (h, groupId, payload) {
  const context = await loadContext(groupId, payload)
  context.rubrics.push('')
  return h.view(templatePath, { ...context, errors: {} }).code(statusCodes.HTTP_STATUS_OK)
}

async function handleDeleteRubric (h, groupId, payload, action) {
  const context = await loadContext(groupId, payload)
  const index = Number.parseInt(action.replace('delete_rubric_', ''), 10)
  context.rubrics = context.rubrics.filter((_, i) => i !== index)
  if (context.rubrics.length === 0) {
    context.rubrics.push('')
  }
  return h.view(templatePath, { ...context, errors: {} }).code(statusCodes.HTTP_STATUS_OK)
}

async function handleSubmit (h, groupId, payload) {
  const context = await loadContext(groupId, payload)
  const rubrics = context.rubrics.filter(r => r.trim())

  const errors = {
    snapshotId: context.snapshotId ? null : 'Select a snapshot',
    truthSourceId: context.truthSourceId ? null : 'Select a truth source',
    rubrics: rubrics.length === 0 ? 'Enter at least one rubric' : null,
    models: context.selectedModels.length === 0 ? 'Select at least one model' : null
  }

  if (Object.values(errors).some(Boolean)) {
    return h.view(templatePath, {
      ...context,
      rubrics: rubrics.length ? rubrics : [''],
      errors
    }).code(statusCodes.HTTP_STATUS_BAD_REQUEST)
  }

  const result = await evaluationService.startEvaluation({
    group_id: groupId,
    snapshot_id: context.snapshotId,
    truth_source_id: context.truthSourceId,
    rubrics,
    models: context.selectedModels
  })

  return h.redirect(`/evaluation/${result.run_id}`).code(statusCodes.HTTP_STATUS_SEE_OTHER)
}

async function submitConfigure (request, h) {
  const { groupId } = request.params
  const { payload } = request
  const { action } = payload

  if (action?.startsWith('delete_rubric_')) {
    return handleDeleteRubric(h, groupId, payload, action)
  }
  if (action === 'add_rubric') {
    return handleAddRubric(h, groupId, payload)
  }
  return handleSubmit(h, groupId, payload)
}

export {
  getConfigureForm,
  submitConfigure
}
