import { createPageLoader, createPageEntries } from 'cosmolo';
import config from '../../../../cosmolo.config';

export const entries = createPageEntries(config);
export const load = createPageLoader(config);
