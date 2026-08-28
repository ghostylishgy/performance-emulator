import { testRegistry } from '../miniprogram/config/test-registry'
import { loveAccidentTest } from '../miniprogram/config/tests/love-accident/index'
import { assertValidLoveTestDefinition } from '../miniprogram/domain/love-validation'
import { validateTestRegistry } from '../miniprogram/domain/validation'

validateTestRegistry(testRegistry)
assertValidLoveTestDefinition(loveAccidentTest)
console.log(`Validated ${testRegistry.length + 1} test definition(s): ${[
  ...testRegistry.map((item) => `${item.id}@${item.version}`),
  `${loveAccidentTest.id}@${loveAccidentTest.version}`,
].join(', ')}`)

