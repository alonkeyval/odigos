import { DISPLAY_TITLES } from '@/utils';
import type { InstrumentationRuleSpec } from '@/types';
import { DATA_CARD_FIELD_TYPES, DataCardFieldsProps } from '@odigos/ui-components';

const buildCard = (rule: InstrumentationRuleSpec) => {
  const { type, ruleName, notes, disabled, profileName, payloadCollection } = rule;

  const arr: DataCardFieldsProps['data'] = [
    { title: DISPLAY_TITLES.TYPE, value: type },
    { type: DATA_CARD_FIELD_TYPES.ACTIVE_STATUS, title: DISPLAY_TITLES.STATUS, value: String(!disabled) },
    { title: DISPLAY_TITLES.NAME, value: ruleName },
    { title: DISPLAY_TITLES.NOTES, value: notes },
    { title: DISPLAY_TITLES.MANAGED_BY_PROFILE, value: profileName },
    { type: DATA_CARD_FIELD_TYPES.DIVIDER, width: '100%' },
  ];

  if (payloadCollection) {
    const str = Object.entries(payloadCollection)
      .filter(([key, val]) => !!val)
      .map(([key, val]) => key)
      .join(', ');

    arr.push({ title: 'Collect', value: str });
  }

  return arr;
};

export default buildCard;
