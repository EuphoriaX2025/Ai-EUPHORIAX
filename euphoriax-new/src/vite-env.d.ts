/// <reference types="vite/client" />

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'ion-icon': {
                name?: string
                size?: string
                color?: string
                className?: string
                style?: React.CSSProperties
                role?: string
                'aria-label'?: string
            }
        }
    }

    interface Window {
        ethereum?: any
        bootstrap?: any
    }

    interface ImportMetaEnv {
        readonly DEV: boolean
        readonly PROD: boolean
        readonly MODE: string
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv
    }
}

export { }
