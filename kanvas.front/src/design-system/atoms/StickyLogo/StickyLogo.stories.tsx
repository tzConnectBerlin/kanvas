import client from '../../../client';

import { StickyLogo } from './StickyLogo';
import { ApolloProvider } from '@apollo/client';
import { Story, Meta } from '@storybook/react';

export default {
  title: 'atoms/StickyLogo',
  component: StickyLogo,
} as Meta;

const Template: Story<typeof StickyLogo> = (args) => ( 
    
        <StickyLogo display={true}/>
    
)
;

export const LoggedIn = Template.bind({});
LoggedIn.args = {
};