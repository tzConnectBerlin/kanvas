import { Suspense } from 'react';
import { ThemeProvider } from '@mui/material';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider as EmotionThemeProvider } from "emotion-theming";
import { darkTheme, lightTheme, lightTheme as theme } from '../src/theme';

import client from '../src/client';

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  themes: {
    default: lightTheme,
    list: [
      lightTheme,
      darkTheme
    ]
  }
}

export const decorators =[
   (Story) => {
    
    return (
    <Suspense fallback={<p>loading...</p>}>
      <ApolloProvider client={client}>
        <EmotionThemeProvider theme={lightTheme}>
          <ThemeProvider theme={lightTheme}>
            <BrowserRouter>
              {Story()}
            </BrowserRouter>
          </ThemeProvider>
        </EmotionThemeProvider>
      </ApolloProvider>
    </Suspense>
  )
}
  ];
