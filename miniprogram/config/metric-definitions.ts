import type { MetricDefinition } from './types'

export const metricDefinitions: MetricDefinition[] = [
  { id: 'P', name: '业务产出', role: 'performance', visibility: 'public', collectFrom: ['personal'] },
  { id: 'V', name: '成果可见度', role: 'performance', visibility: 'public', collectFrom: ['personal'] },
  { id: 'I', name: '组织影响力', role: 'performance', visibility: 'public', collectFrom: ['personal'] },
  { id: 'K', name: '不可替代性', role: 'performance', visibility: 'public', collectFrom: ['personal'] },
  { id: 'F', name: '大厂适配度', role: 'performance', visibility: 'public', collectFrom: ['personal'] },
  { id: 'A', name: '自主驱动', role: 'trait', visibility: 'hidden', collectFrom: ['personal'] },
  { id: 'O', name: '组织杠杆', role: 'trait', visibility: 'hidden', collectFrom: ['personal'] },
  { id: 'L', name: '直属领导支持度', role: 'environment', visibility: 'hidden', collectFrom: ['organization'] },
  { id: 'S', name: '项目战略位置', role: 'environment', visibility: 'hidden', collectFrom: ['organization'] },
  { id: 'R', name: '成果归属清晰度', role: 'environment', visibility: 'hidden', collectFrom: ['personal', 'organization'] },
  { id: 'T', name: '组织位置确定感', role: 'environment', visibility: 'hidden', collectFrom: ['personal', 'organization'] },
]

