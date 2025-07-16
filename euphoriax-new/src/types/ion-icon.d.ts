import { type CSSProperties } from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'ion-icon': {
                name: string;
                size?: string;
                color?: string;
                className?: string;
                style?: CSSProperties;
                role?: string;
                'aria-label'?: string;
            };
        }
    }
}

export { };