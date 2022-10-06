export interface InputSelectorProps {
  attributesName: string;
  label: string;
  type:
    | 'string'
    | 'boolean'
    | 'number'
    | 'content_uri'
    | 'number[]'
    | 'votes'
    | 'date'
    | 'none'
    | 'text';
  record?: any;
  numberValueArray?: string[];
}
