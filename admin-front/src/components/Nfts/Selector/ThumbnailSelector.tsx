import { BooleanInput, FileField, FileInput } from 'react-admin';
import { FC, useState } from 'react';
import { SelectorProps } from './types';

const ThumbnailSelector: FC<SelectorProps> = (props) => {
  const [showThumbnail, setShowThumbnail] = useState(false);
  const [showSwitch, setShowSwitch] = useState(true);
  const { label } = props;

  const toggleShowThumbnail = () => {
    setShowThumbnail(!showThumbnail);
  };

  const handleOnRemove = () => {
    setShowSwitch(true);
    setShowThumbnail(false);
  };

  const handleOnDrop = () => {
    setShowSwitch(false);
  };

  return (
    <>
      {showSwitch && (
        <BooleanInput
          source={`addThumbnailBooleanInput`}
          label={'add thumbnail'}
          options={{ checked: showThumbnail }}
          onChange={() => toggleShowThumbnail()}
        />
      )}
      {showThumbnail && (
        <FileInput
          label={label}
          source={`files[${label}]`}
          options={{
            onDrop: handleOnDrop,
            onRemove: handleOnRemove,
          }}
        >
          <FileField src={`attributes.${label}`} source="src" title="title" />
        </FileInput>
      )}
    </>
  );
};

export default ThumbnailSelector;
