import { testRegistry } from '../miniprogram/config/test-registry'
import { productRegistry, validateProductRegistry } from '../miniprogram/config/products'
import { loveAccidentTest } from '../miniprogram/config/tests/love-accident/index'
import { assertValidLoveTestDefinition } from '../miniprogram/domain/love-validation'
import { validateTestRegistry } from '../miniprogram/domain/validation'

validateTestRegistry(testRegistry)
assertValidLoveTestDefinition(loveAccidentTest)
validateProductRegistry(productRegistry)
console.log(`Validated ${testRegistry.length + 1} test definition(s): ${[
  ...testRegistry.map((item) => `${item.id}@${item.version}`),
  `${loveAccidentTest.id}@${loveAccidentTest.version}`,
].join(', ')}`)
console.log(`Validated ${productRegistry.length} product definition(s): ${productRegistry.map((item) => item.product_id).join(', ')}`)

