import type { Config } from 'jest';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

const config: Config = {
  verbose: true,
};

export default config;
