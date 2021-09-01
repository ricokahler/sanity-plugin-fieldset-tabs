import { forwardRef, useState, useMemo, useEffect } from 'react';
import {
  SchemaType,
  ObjectSchemaType,
  MultiFieldSet,
  Path,
  Marker,
  isKeySegment,
  isIndexTuple,
} from '@sanity/types';
import styled from 'styled-components';
import {
  TabList,
  Tab,
  TabPanel,
  Card,
  Text,
  Box,
  Tooltip,
  Flex,
} from '@sanity/ui';
import { ErrorOutlineIcon, WarningOutlineIcon } from '@sanity/icons';
import {
  FormBuilderInput,
  FormBuilderInputProps,
} from '@sanity/form-builder/lib/FormBuilderInput';
import startCase from 'lodash.startcase';

const RedErrorOutlineIcon = styled(ErrorOutlineIcon)`
  color: ${({ theme }) => theme.sanity.color.solid.critical.enabled.bg};
`;

const CautionWarningIcon = styled(WarningOutlineIcon)`
  color: ${({ theme }) => theme.sanity.color.solid.caution.enabled.bg};
`;

const Breadcrumbs = styled(Text)`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow-x: hidden;
  max-width: 192px;
  margin-top: -8px;

  &::before {
    display: none;
  }

  & > *:not(:last-child) {
    position: relative;
    margin-right: 1rem;
  }

  & > *:not(:last-child)::before {
    content: '/';
    position: absolute;
    top: 50%;
    left: calc(100% + 1rem / 2);
    transform: translate(-50%, -50%);
  }
`;

function assertMultiFieldsets(type: SchemaType): asserts type is Omit<
  ObjectSchemaType,
  'fieldsets'
> & {
  fieldsets: MultiFieldSet[];
} {
  if (type.jsonType !== 'object') {
    throw new Error('Expect to be attached to an object field or document');
  }
  if (!type.fieldsets?.length) {
    throw new Error('At least one fieldset is required for Fieldset Tabs');
  }
  if (type.fieldsets?.some((fieldset) => fieldset.single)) {
    throw new Error(
      'Every field must be part of a fieldset. Single fieldsets are not supported.'
    );
  }
}

function createFieldsetUtils(fieldsets: MultiFieldSet[]) {
  console.log('made thing');
  const fieldNamesByFieldset = fieldsets.reduce<Map<string, string[]>>(
    (acc, fieldset) => {
      acc.set(
        fieldset.name,
        fieldset.fields.map((field) => field.name)
      );

      return acc;
    },
    new Map()
  );

  const fieldsetNames = fieldsets.reduce<
    Map<string, { excluded: Set<string> }>
  >((acc, fieldset) => {
    const otherFieldsets = fieldsets.filter(
      (otherFieldset) => fieldset !== otherFieldset
    );

    acc.set(fieldset.name, {
      excluded: new Set(
        otherFieldsets.flatMap(
          (otherFieldset) => fieldNamesByFieldset.get(otherFieldset.name) || []
        )
      ),
    });

    return acc;
  }, new Map());

  const fieldsetByName = fieldsets.reduce<Map<string, MultiFieldSet>>(
    (acc, fieldset) => {
      for (const field of fieldset.fields) acc.set(field.name, fieldset);
      return acc;
    },
    new Map()
  );

  return {
    fieldsetHasField: (fieldsetName: string, fieldName: string) => {
      const results = fieldsetNames.get(fieldsetName);
      if (!results) return false;
      return !results.excluded.has(fieldName);
    },
    getFieldsetByPath: ([pathSegment]: Path = []) => {
      if (!pathSegment) return null;
      if (isIndexTuple(pathSegment)) return null;
      if (isKeySegment(pathSegment)) return null;
      if (typeof pathSegment === 'object') return null;
      return fieldsetByName.get(pathSegment.toString()) || null;
    },
  };
}

function resolvePathTitle(path: Path, schemaType: SchemaType): string[] {
  const [name, ...restOfPath] = path;
  if (!name) return [];

  // `startCase` is also used in the `@sanity/schema` to populate titles from the name
  const current = schemaType.title || startCase(schemaType.name);
  let nextField: SchemaType | undefined;

  if (schemaType.jsonType === 'object') {
    nextField = schemaType.fields.find((field) => field.name === name)?.type;
  } else if (schemaType.jsonType === 'array') {
    nextField = schemaType.of.find((type) => type.name === name);
  }

  const next = nextField ? resolvePathTitle(restOfPath, nextField) : [];
  return [current, ...next];
}

function getLevel(markers: Marker[]) {
  let foundWarning = false;
  for (const marker of markers) {
    if (marker.level === 'error') return 'error';
    if (marker.level === 'warning') foundWarning = true;
  }
  if (foundWarning) return 'warning';
  return null;
}

export const FieldsetTabs = forwardRef(
  (
    { type, value, ...restOfProps }: FormBuilderInputProps,
    ref: React.Ref<any>
  ) => {
    assertMultiFieldsets(type);

    const id = useMemo(() => `fieldset-tabs-${Math.random()}`, []);
    const { focusPath, markers } = restOfProps;
    const { fieldsets } = type;
    const [activeFieldset, setActiveFieldset] = useState<MultiFieldSet>(
      fieldsets[0]
    );

    const { fieldsetHasField, getFieldsetByPath } = useMemo(
      () => createFieldsetUtils(fieldsets),
      [fieldsets]
    );

    useEffect(() => {
      setActiveFieldset(
        (activeFieldset) => getFieldsetByPath(focusPath) || activeFieldset
      );
    }, [focusPath, getFieldsetByPath]);

    const getMarkers = useMemo(() => {
      const markersByFieldset = markers.reduce<Map<MultiFieldSet, Marker[]>>(
        (acc, marker) => {
          const fieldset = getFieldsetByPath(marker.path);
          if (!fieldset) return acc;

          const arr = acc.get(fieldset) || [];
          arr.push(marker);
          acc.set(fieldset, arr);

          return acc;
        },
        new Map()
      );

      return (fieldset: MultiFieldSet) => markersByFieldset.get(fieldset) || [];
    }, [getFieldsetByPath, markers]);

    const fieldsetType = useMemo(() => {
      return {
        ...type,
        inputComponent: undefined,
        fields: type.fields
          .filter((field) => fieldsetHasField(activeFieldset.name, field.name))
          .map(({ fieldset, ...field }) => field),
        fieldsets: undefined,
      };
    }, [fieldsetHasField, activeFieldset.name, type]);

    const fieldsetValue = useMemo(() => {
      if (typeof value !== 'object') return value;
      if (!value) return value;

      return Object.fromEntries(
        Object.entries(value).filter(([name]) =>
          fieldsetHasField(activeFieldset.name, name)
        )
      );
    }, [activeFieldset.name, fieldsetHasField, value]);

    return (
      <>
        <TabList
          aria-label={`Sections for ${startCase(type.title || type.name)}`}
          space={2}
        >
          {fieldsets.map((fieldset) => {
            const fieldsetMarkers = getMarkers(fieldset);
            const amountToShow = 5;
            const amountLeft = Math.max(
              fieldsetMarkers.length - amountToShow,
              0
            );
            const level = getLevel(fieldsetMarkers);

            const tooltipContent = (
              <Flex
                aria-label={`${fieldsetMarkers.length} validation issue${
                  fieldsetMarkers.length === 1 ? '' : 's'
                }`}
                as="ul"
                direction="column"
                padding={2}
                gap={2}
              >
                {fieldsetMarkers.slice(0, amountToShow).map((marker) => (
                  <Box paddingLeft={1} paddingRight={2} paddingY={2} as="li">
                    <Flex gap={2} align="flex-start">
                      <Box padding={1} paddingLeft={0}>
                        <Text size={1}>
                          {marker.level === 'error' ? (
                            <RedErrorOutlineIcon />
                          ) : (
                            <CautionWarningIcon />
                          )}
                        </Text>
                      </Box>

                      <Box>
                        <Flex direction="column" gap={1}>
                          <Breadcrumbs weight="medium" size={1}>
                            {resolvePathTitle(marker.path, type).map(
                              (segment) => (
                                <span>{segment}</span>
                              )
                            )}
                          </Breadcrumbs>
                          <Text style={{ flex: 0 }} muted size={1}>
                            {marker.item.message}
                          </Text>
                        </Flex>
                      </Box>
                    </Flex>
                  </Box>
                ))}

                {!!amountLeft && (
                  <Box paddingX={1} marginY={2} as="li">
                    <Text style={{ flex: 0 }} muted size={1}>
                      {amountLeft === 1
                        ? `and one more`
                        : `and ${amountLeft} others`}
                    </Text>
                  </Box>
                )}
              </Flex>
            );

            return (
              <Tab
                aria-controls={`content-panel-${id}`}
                id={`content-tab-${id}`}
                // @ts-expect-error: i have no idea why this is erroring
                label={
                  <Box>
                    <Flex gap={1} align="center">
                      <div>{startCase(fieldset.title || fieldset.name)}</div>

                      <Tooltip portal content={tooltipContent}>
                        {level ? (
                          <Box padding={1}>
                            <Text size={1}>
                              {level === 'error' ? (
                                <RedErrorOutlineIcon />
                              ) : (
                                <CautionWarningIcon />
                              )}
                            </Text>
                          </Box>
                        ) : (
                          <></>
                        )}
                      </Tooltip>
                    </Flex>
                  </Box>
                }
                onClick={() => {
                  setActiveFieldset(fieldset);
                  restOfProps.onFocus([fieldset.fields[0].name]);
                }}
                selected={activeFieldset === fieldset}
              />
            );
          })}
        </TabList>

        {activeFieldset.description && (
          <Box paddingTop={5} paddingBottom={3}>
            <Text muted size={1}>
              {activeFieldset.description}
            </Text>
          </Box>
        )}

        <TabPanel
          aria-labelledby={`content-tab-${id}`}
          id={`content-panel-${id}`}
        >
          <Card marginTop={2} paddingY={4} radius={2}>
            <FormBuilderInput
              {...restOfProps}
              ref={ref}
              value={fieldsetValue}
              type={fieldsetType}
            />
          </Card>
        </TabPanel>
      </>
    );
  }
);

FieldsetTabs.displayName = 'FieldsetTabs';
