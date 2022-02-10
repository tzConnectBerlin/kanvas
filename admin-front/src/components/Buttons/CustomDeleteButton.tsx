import { BulkDeleteWithUndoButton } from 'react-admin';

export const CustomDeleteButton = () => (
  <BulkDeleteWithUndoButton
    variant="contained"
    color="primary"
    label="Delete"
  />
);