import { defaultTheme } from 'react-admin';
import { createTheme } from '@material-ui/core/styles';
import merge from 'lodash/merge';


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
          avatar: string;
          paper: string;
          shoppingCart: string;
      };
      boxShadow: {
          default: string;
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
          avatar: string;
          paper: string;
          shoppingCart: string;
      };
      boxShadow: {
          default: string;
      };
  }
}

export const theme = createTheme(
  
  merge({}, defaultTheme, {
    palette: {
      type: 'light',
      primary: {
        main: '#9771ff',
      },
      secondary: {
        main: '#fff',
        color: 'rgb(196, 196, 196)',
      },
      alternateTextColor: 'rgb(151, 113, 255)!important',
      components: {},
    },
    props: {
      MuiAppBar: {
        color: 'secondary',
      },
      MuiButtonBase: {
        // disable ripple for perf reasons
        disableRipple: true,
      },
      MuiCheckboxBase: {
        size: 'small',
        color: 'secondary !important',
      },
    },
    overrides: {

      MuiToolbar: {
        regular: {
          MuiButtonBase: {
            backgroundColor: 'white',
            borderRadius: '100px  !important',
            border: '1px solid rgb(196, 196, 196)',
            boxShadow: 'none',
            padding: '.45rem  2.9rem',
            color: 'rgba(29, 34, 39, 0.87) !important',
            transition: 'all .1s linear 0s',
          },
        },
      },
      MuiTooltip: {
        tooltip: {
          backgroundColor: '#9771ff',
        },
      },
      RaMenuItemLink: {
        active: {
          color: '#9771ff',
          '& .MuiListItemIcon-root': {
            color: '#9771ff',
          },
        },
        root: {
          borderLeft: '3px solid #fff', // invisible menu when not active, to avoid scrolling the text when selecting the menu
        },
      },

      dropShadow: {
        paper: 'drop-shadow(0 0 6rem #fafafa)',
        default: 'drop-shadow(0 0 0.45rem #C4C4C4)',
        hover: 'drop-shadow(0 0 0.55rem #C4C4C4)',
        avatar: 'drop-shadow(0 0 0.25rem #e0e0e0)',
        shoppingCart: 'drop-shadow(0 1rem 0.55rem #C4C4C4)',
    },

      MuiButtonBase: {
        root: {
          '&.MuiButton-containedPrimary': {
            backgroundColor: 'white',
            borderRadius: '100px  !important',
            border: '1px solid rgb(196, 196, 196)',
            boxShadow: 'none',
            padding: '.5rem  1.2rem',
            color: 'rgba(29, 34, 39, 0.87) !important',
            margin: '.5rem 0 .8rem',
            transition: 'all .1s linear 0s',
            '&:hover': {
              boxShadow: '0 0 0 0 rgb(0 0 0 / 0%)',
              border: '1px solid rgb(151, 113, 255)',
              backgroundColor: 'white',
            },
          },
        },
      },
    },
    typography: {
      fontWeightRegular: 400,
      fontWeightBold: 700,
      allVariants: {
        fontFamily: 'Poppins',
      },
      h1: {
        fontFamily: 'Poppins SemiBold',
        fontSize: '4.5rem',
      },
      h2: {
        fontFamily: 'Poppins SemiBold',
        fontSize: '1.6rem',
        lineHeight: '1.3',
      },
      h3: {
        fontSize: '1.3rem',
        lineHeight: '1.3',
      },
      h4: {
        fontSize: '1.2rem',
        lineHeight: '1.3',
      },
      h5: {
        fontSize: '1rem',
        lineHeight: '1.3',
      },
      h6: {
        fontSize: '1rem',
        fontWeight: '700',
        lineHeight: '1.3',
        color: 'rgba(29, 34, 39, 0.87) !important',
      },
      subtitle1: {
        fontSize: '0.75rem',
        lineHeight: '1.3',
        display: 'flex',
        alignItems: 'center',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: '1.3',
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
    shape: {
      borderRadius: 5,
    },
  }),
);