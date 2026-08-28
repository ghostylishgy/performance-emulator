interface MiniProgramWxApi {
  [key: string]: any
  reportEvent?: (eventId: string, data?: Record<string, string | number>) => void
  reportAnalytics?: (eventName: string, data: Record<string, string | number>) => void
}

declare const wx: MiniProgramWxApi
declare function App(options: any): void
declare function Page(options: any): void
declare function Component(options: any): void
declare function getCurrentPages(): any[]

