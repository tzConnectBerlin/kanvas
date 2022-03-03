import Chip from '@material-ui/core/Chip';
import { ArrayFieldProps } from 'ra-ui-materialui';
import * as React from 'react';

interface TextArrayFieldProps extends ArrayFieldProps {
  value: { [i: number]: string };
}

export const TextArrayField: React.FC<TextArrayFieldProps> = ({
  record,
  source,
  value,
}) => {
  const array = source ? record?.[source] : [];
  debugger
  if (typeof array === 'undefined' || array === null || array.length === 0) {
    return <div />;
  } else {
    return (
      <>
        {array.map((item: string | number) => (
          <Chip label={value[+item - 1]} key={item} />
        ))}
      </>
    );
  }
};

TextArrayField.defaultProps = { addLabel: true };
