import { ITheme } from './interfaces/theme';
import { createTheme, PaletteOptions } from '@mui/material/styles';

export const DarkTheme: ITheme = {
    background: {
        color: '#141414',
    },
    logo: {
        filter: 'invert(100%)',
    },
    typography: {
        color: {
            primary: '#ffffff',
        },
    },
};

export const LightTheme: ITheme = {
    background: {
        color: '#ffffff',
    },
    logo: {
        filter: 'invert(0%)',
    },
    typography: {
        color: {
            primary: '#000000',
        },
    },
};

declare module '@mui/material/styles' {
    interface Theme {
        logo: {
            filter: string;
        };
        button: {
            background: string;
        };
        header: {
            background: string;
        };
        footer: {
            background: string;
        };
        dropShadow: {
            default: string;
            hover: string;
        };
    }
    // allow configuration using `createTheme`
    interface ThemeOptions {
        logo: {
            filter: string;
        };
        button: {
            background: string;
        };
        header: {
            background: string;
        };
        footer: {
            background: string;
        };
        dropShadow: {
            default: string;
            hover: string;
        };
    }
}

const lightThemePalette: PaletteOptions = {
    primary: {
        dark: 'rgba(30, 30, 30, 1)',
        main: 'rgba(1, 102, 255, 1)',
        light: 'rgba(1, 102, 255, 0.12)',
        contrastText: '#0088a7',
    },
    secondary: {
        dark: 'rgba(1, 102, 255, 0.10)',
        main: 'rgba(1, 102, 255, 0.12)',
        contrastText: '#0088a7',
    },
    success: {
        dark: 'rgba(212, 241, 204, 1)',
        main: 'rgba(42, 184, 0, 1)',
    },
    warning: {
        dark: 'rgba(255, 229, 212, 1)',
        main: 'rgba(253, 125, 42, 1)',
    },
    error: {
        dark: 'rgba(255, 215, 215, 1)',
        main: 'rgba(255, 57, 57, 1)',
        light: 'rgba(255, 215, 215, 0.12)',
    },
    grey: {
        '900': 'rgba(29, 34, 39, 1)',
        '800': 'rgba(29, 34, 39, 0.87)',
        '700': 'rgba(29, 34, 39, 0.38)',
        '600': 'rgba(29, 34, 39, 0.09)',
        '500': 'rgba(29, 34, 39, 0.07)',
        '400': 'rgba(29, 34, 39, 0.06)',
        '300': 'rgba(29, 34, 39, 0.04)',
        '200': 'rgba(29, 34, 39, 0.03)',
        '100': 'rgba(29, 34, 39, 0.02)',
    },
    text: {
        primary: 'rgba(29, 34, 39, 0.87)',
        secondary: '#C4C4C4',
        disabled: 'rgba(29, 34, 39, 0.38)',
    },
    background: {
        default: 'rgba(253, 253, 255, 1)',
        paper: 'rgba(255, 255, 255, 1)',
    },
    tonalOffset: 0.05,
    mode: 'light',
};

const darkThemePalette: PaletteOptions = {
    primary: {
        dark: '#ebebeb',
        main: 'rgba(1, 102, 255, 1)',
        light: 'rgba(1, 102, 255, 0.12)',
        contrastText: '#0088a7',
    },
    secondary: {
        dark: 'rgba(1, 102, 255, 0.10)',
        main: 'rgba(1, 102, 255, 0.12)',
        contrastText: 'r#0088a7',
    },
    success: {
        dark: 'rgba(212, 241, 204, 1)',
        main: 'rgba(42, 184, 0, 1)',
    },
    warning: {
        dark: 'rgba(255, 229, 212, 1)',
        main: 'rgba(253, 125, 42, 1)',
    },
    error: {
        dark: 'rgba(255, 215, 215, 1)',
        main: 'rgba(255, 57, 57, 1)',
        light: 'rgba(255, 215, 215, 0.12)',
    },
    grey: {
        '900': 'rgba(29, 34, 39, 1)',
        '800': 'rgba(29, 34, 39, 0.87)',
        '700': 'rgba(29, 34, 39, 0.38)',
        '600': 'rgba(29, 34, 39, 0.09)',
        '500': 'rgba(29, 34, 39, 0.07)',
        '400': 'rgba(29, 34, 39, 0.06)',
        '300': 'rgba(29, 34, 39, 0.04)',
        '200': 'rgba(29, 34, 39, 0.03)',
        '100': 'rgba(29, 34, 39, 0.02)',
    },
    text: {
        primary: 'rgb(255, 255, 255)',
        secondary: '#C4C4C4',
        disabled: 'rgba(29, 34, 39, 0.38)',
    },
    background: {
        default: '#0a0a0a',
        paper: '#2c2c2c',
    },
    tonalOffset: 0.05,
    mode: 'dark',
};

export const lightTheme = createTheme({
    palette: lightThemePalette,
    typography: {
        fontWeightRegular: 400,
        fontWeightBold: 700,
        h1: {
            fontSize: '4.5rem',
            lineHeight: '1.5',
            fontFamily: 'Poppins',
        },
        h2: {
            fontSize: '1.6rem',
            lineHeight: '1.3',
            fontFamily: 'Poppins',
        },
        h3: {
            fontSize: '1.3rem',
            lineHeight: '1.3',
            fontFamily: 'Poppins',
        },
        h4: {
            fontSize: '1.2rem',
            lineHeight: '1.3',
            fontFamily: 'Poppins',
        },
        h5: {
            fontSize: '1rem',
            lineHeight: '1.3',
            fontFamily: 'Poppins',
        },
        h6: {
            fontWeight: 700,
            fontSize: '0.625rem',
            lineHeight: '1.3',
            fontFamily: 'Poppins',
        },
        subtitle1: {
            fontSize: '0.75rem',
            lineHeight: '1.3',
            fontFamily: 'Poppins',
        },
        body1: {
            fontSize: '1rem',
            lineHeight: '1.3',
            fontFamily: 'Poppins',
        },
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536,
        },
    },
    zIndex: {
        tooltip: 9999,
    },
    logo: {
        filter: 'invert(0%)',
    },
    button: {
        background: 'rgba(255, 255, 255, 1)',
    },
    header: {
        background: 'rgba(255, 255, 255, 0.5)',
    },
    footer: {
        background: 'rgba(255, 255, 255, 1)',
    },
    dropShadow: {
        default: 'drop-shadow(0px 0px 6px #5c5c5c2d)',
        hover: 'drop-shadow(0px 0px 6px #1f1f1f33)',
    },
});

export const darkTheme = createTheme({
    palette: darkThemePalette,
    typography: {
        fontWeightRegular: 400,
        fontWeightBold: 700,
        h1: {
            fontSize: '4.5rem',
            lineHeight: '1.5',
            fontFamily: 'Poppins',
        },
        h2: {
            fontSize: '1.6rem',
            lineHeight: '1.3',
            fontFamily: 'Poppins',
        },
        h3: {
            fontSize: '1.3rem',
            lineHeight: '1.3',
            fontFamily: 'Poppins',
        },
        h4: {
            fontSize: '1.2rem',
            lineHeight: '1.3',
            fontFamily: 'Poppins',
        },
        h5: {
            fontSize: '1rem',
            lineHeight: '1.3',
            fontFamily: 'Poppins',
        },
        h6: {
            fontSize: '0.625rem',
            lineHeight: '1.3',
            fontFamily: 'Poppins',
        },
        subtitle1: {
            fontSize: '0.75rem',
            lineHeight: '1.3',
            fontFamily: 'Poppins',
        },
        body1: {
            fontSize: '1rem',
            lineHeight: '1.3',
            fontFamily: 'Poppins',
        },
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536,
        },
    },
    zIndex: {
        tooltip: 9999,
    },
    logo: {
        filter: 'invert(100%)',
    },
    button: {
        background: '#2c2c2c',
    },
    header: {
        background: 'rgba(22, 22, 22, 0.5)',
    },
    footer: {
        background: 'rgba(0, 0, 0, 1)',
    },
    dropShadow: {
        default: 'drop-shadow(0px 0px 10px #18181886)',
        hover: 'drop-shadow(0px 0px 10px #0e0e0e9b)',
    },
});
