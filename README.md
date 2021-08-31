# sanity-plugin-fieldset-tabs

```
yarn add sanity-plugin-fieldset-tabs
```

then

```js
import {FieldsetTabs} from 'sanity-plugin-fieldset-tabs'

const mySchema = {
  name: 'movie',
  type: 'document',
  title: 'Movie',
  inputComponent: FieldsetTabs,
  fieldsets: [{ name: 'tabA' }, { name: 'tabB' }],
  fields: [
    {
      name: 'title',
      type: 'string',
      fieldset: 'tabA',
    },
    {
      name: 'description',
      type: 'array',
      of: [{type: 'block'}]
      fieldset: 'tabB',
    },
  ],
};
```

every field must belong to a fieldset for now.

## DISCLAIMER: VERY ALPHA!!
