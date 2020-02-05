import betaConfig from './beta.env';
import productionConfig from './production.env';

const environmentConfigs = {
  beta: betaConfig,
  production: productionConfig,
  development: betaConfig,
  test: betaConfig
};

export default environmentConfigs[process.env.NODE_ENV];
