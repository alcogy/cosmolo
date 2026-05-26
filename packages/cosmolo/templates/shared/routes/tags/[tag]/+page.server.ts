import { createTagLoader, createTagEntries } from 'cosmolo';
import config from '../../../../cosmolo.config';

export const entries = createTagEntries(config);
export const load = createTagLoader(config);
