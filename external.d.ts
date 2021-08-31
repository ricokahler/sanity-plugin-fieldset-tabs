declare module 'part:*';

declare module '*.module.css' {
  const content: {
    [identifier: string]: any;
  };
  export = content;
}

declare module '@sanity/form-builder/lib/FormBuilderInput' {
  import { Marker, Path, SchemaType } from '@sanity/types';

  export interface FormBuilderInputProps {
    ref?: React.Ref<any>;
    value: unknown;
    type: SchemaType;
    onChange: (event: any) => void;
    onFocus: (path: Path) => void;
    onBlur: () => void;
    readOnly?: boolean;
    presence?: any[];
    focusPath?: Path;
    markers: Marker[];
    compareValue?: any;
    level: number;
    isRoot?: boolean;
    path: Path;
    filterField?: (...args: any[]) => any;
    onKeyUp?: (ev: React.KeyboardEvent) => void;
    onKeyPress?: (ev: React.KeyboardEvent) => void;
  }

  export const FormBuilderInput: React.ComponentType<FormBuilderInputProps>;
}
