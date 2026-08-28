import { testRegistry } from './config/test-registry'
import { productRegistry, validateProductRegistry } from './config/products'
import { loveAccidentTest } from './config/tests/love-accident/index'
import { assertValidLoveTestDefinition } from './domain/love-validation'
import { validateTestRegistry } from './domain/validation'

App({
  onLaunch() {
    validateProductRegistry(productRegistry)
    validateTestRegistry(testRegistry)
    assertValidLoveTestDefinition(loveAccidentTest)
  },
})

