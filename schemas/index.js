import { IceCreamIcon, EarthGlobeIcon } from '@sanity/icons';
import createSchema from 'part:@sanity/base/schema-creator';
import schemaTypes from 'all:part:@sanity/base/schema-type';
import { FieldsetTabs } from '../sanity-plugin-fieldset-tabs';

export default createSchema({
  name: 'default',
  types: schemaTypes.concat([
    {
      inputComponent: FieldsetTabs,
      type: 'document',
      name: 'example',
      title: 'Example',
      fieldsets: [
        { name: 'movie', title: 'Movie', icon: IceCreamIcon },
        {
          name: 'person',
          title: 'Person',
          description: 'This one has a description',
          icon: EarthGlobeIcon,
        },
      ],
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          fieldset: 'movie',
          validation: (rule) => rule.required(),
        },
        {
          name: 'overview',
          title: 'Overview',
          type: 'array',
          of: [{ type: 'block' }],
          fieldset: 'movie',
        },
        {
          name: 'releaseDate',
          title: 'Release date',
          type: 'datetime',
          fieldset: 'movie',
        },
        {
          name: 'externalId',
          title: 'External ID',
          type: 'number',
          fieldset: 'movie',
        },
        {
          name: 'popularity',
          title: 'Popularity',
          type: 'number',
          fieldset: 'movie',
        },
        {
          name: 'poster',
          title: 'Poster Image',
          type: 'image',
          options: { hotspot: true },
          fieldset: 'movie',
        },
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          description: 'Please use "Firstname Lastname" format',
          fieldset: 'person',
        },
        {
          name: 'image',
          title: 'Image',
          type: 'image',
          options: { hotspot: true },
          fieldset: 'person',
        },
        {
          name: 'exampleObj',
          type: 'object',
          fields: [
            {
              name: 'foo',
              type: 'string',
              validation: (rule) => rule.required().error('Testing'),
            },
            {
              name: 'bar',
              type: 'number',
              validation: (rule) => rule.required().error('Another'),
            },
          ],
          fieldset: 'person',
          validation: rule => rule.required().custom(() => 'hey there'),
        },
      ],
    },
  ]),
});
