import Chip from '@material-ui/core/Chip';
import { ArrayFieldProps } from 'ra-ui-materialui';
import * as React from 'react';

interface TextArrayFieldProps extends ArrayFieldProps {
  value?: { [i: string | number]: string };
}

export const TextArrayField: React.FC<TextArrayFieldProps> = ({
  record,
  source,
  value,
}) => {
  const array = record?.[source ?? 0];
  if (typeof array === 'undefined' || array === null || array.length === 0) {
    return <div />;
  } else {
    return (
      <>
        {array.map((item: string) => (
          <Chip label={value?.[item] ?? item} key={item} />
        ))}
      </>
    );
  }
};
TextArrayField.defaultProps = { addLabel: true };
