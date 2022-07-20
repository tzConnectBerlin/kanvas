/* eslint-disable import/no-webpack-loader-syntax */
import Content from '!@mdx-js/loader!./content.mdx'
import React from 'react'

export default class Privacy2 extends React.Component {
  render() {
    // return <div>bla</div>;
    return (<Content/>);
  }
}

// export default Content;
// export default function Privacy2() {
//   return <Content />;
// }
