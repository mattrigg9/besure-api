import betaConfig from './beta.env';
import productionConfig from './production.env';

enum Stage {
  beta = 'beta',
  production = 'production',
  development = 'development',
  test = 'test'
}

const environmentConfigs = {
  [Stage.beta]: betaConfig,
  [Stage.production]: productionConfig,
  [Stage.development]: betaConfig,
  [Stage.test]: betaConfig
};

if (!process.env.NODE_ENV) throw new Error("NODE_ENV must be defined");

export default environmentConfigs[process.env.NODE_ENV as Stage];
