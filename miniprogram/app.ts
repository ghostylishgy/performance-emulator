import { testRegistry } from './config/test-registry'
import { validateTestRegistry } from './domain/validation'

App({
  onLaunch() {
    validateTestRegistry(testRegistry)
    if (wx.cloud) wx.cloud.init({ traceUser: true })
  },
})

