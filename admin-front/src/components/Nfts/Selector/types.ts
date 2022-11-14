export type FormFieldInputType =
  | 'string'
  | 'boolean'
  | 'number'
  | 'content'
  | 'number[]'
  | 'votes'
  | 'date'
  | 'none'
  | 'text';

export interface SelectorProps {
  attributesName: string;
  label: string;
  type: FormFieldInputType;
  record?: any;
  numberValueArray?: string[];
}
