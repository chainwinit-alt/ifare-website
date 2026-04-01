// declare the variable in typescript.
export {}

declare module 'vue' {
    interface ComponentCustomProperties {
        $CommonLib: any,
        $WebAPI: any
    }
}