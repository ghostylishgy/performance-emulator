import { testRegistry } from '../miniprogram/config/test-registry'
import { validateTestRegistry } from '../miniprogram/domain/validation'

validateTestRegistry(testRegistry)
console.log(`Validated ${testRegistry.length} TestDefinition(s): ${testRegistry.map((item) => `${item.id}@${item.version}`).join(', ')}`)

