import { createCategoryLoader, createCategoryEntries } from 'cosmolo';
import config from '../../../../cosmolo.config';

export const entries = createCategoryEntries(config);
export const load = createCategoryLoader(config);
