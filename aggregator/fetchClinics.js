import Axios from 'axios';
import { pause } from '../utils';
const fs = require('fs');

class CoordinateSquare {
  constructor(bottomLeftLimit, upperRightLimit, squareSize) {
    this.bottomLeftLimit = bottomLeftLimit;
    this.upperRightLimit = upperRightLimit;
    this.squareSize = squareSize;

    this.bottomLeftLat = bottomLeftLimit[0];
    this.bottomLeftLong = bottomLeftLimit[1];
  }

  get upperRightLat() {
    return this.bottomLeftLat + this.squareSize;
  }

  get upperRightLong() {
    return this.bottomLeftLong + this.squareSize;
  }

  moveHorizontally(units) {
    this.bottomLeftLong += (this.squareSize * units);
  }

  moveVertically(units) {
    this.bottomLeftLat += (this.squareSize * units);
  }

  resetHorizontal() {
    this.bottomLeftLong = bottomLeftLimit[1];
  }

  endOfHorizontalLimit() {
    return this.upperRightLong >= this.upperRightLimit[1];
  }

  endOfVerticalLimit() {
    return this.upperRightLat >= this.upperRightLimit[0];
  }
}

const fetchClinics = async (coordinateSquare) => {
  //bottomLeftLAT, upperRightLAT -- bottomLeftLONG, upperRightLONG
  const url = `https://npin.cdc.gov/api/organization/gettested/json/${coordinateSquare.bottomLeftLat}--${coordinateSquare.upperRightLat}/${coordinateSquare.bottomLeftLong}--${coordinateSquare.upperRightLong}`;
  console.log('url', url);
  const options = {
    method: 'get',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      Host: 'npin.cdc.gov',
      Origin: 'https://gettested.cdc.gov',
      Referer: 'https://gettested.cdc.gov/search_results'
    },
    url
  };

  return Axios(options);
};

const cleanData = (features) => features.map((feature) => {
  const cleanName = feature.properties.name && feature.properties.name.replace(/<[^>]+>/g, '').replace(/\|/g, ' ').trim();
  let cleanWebsite = feature.properties.gsl_props_web_rendered && feature.properties.gsl_props_web_rendered.replace(/\|/g, ' ').trim();
  if (cleanWebsite && !cleanWebsite.match(/https?:\/\//)) {
    cleanWebsite = `http://${cleanWebsite}`;
  }

  const { tests, vaccines } = getTestsAndVaccines(feature.properties.gsl_feature_filter_list_rendered);
  return {
    id: feature.properties.nid,
    name: cleanName,
    address: feature.properties.description && feature.properties.description.toString().trim(),
    latitude: feature.geometry.coordinates[1],
    longitude: feature.geometry.coordinates[0],
    phone: feature.properties.gsl_props_phone_rendered && feature.properties.gsl_props_phone_rendered.replace && feature.properties.gsl_props_phone_rendered.replace(/\D/g, ''),
    website: cleanWebsite,
    fees: getFees(feature.properties.fees),
    tests,
    vaccines
  };
});

const serviceMap = {
  hiv: 'conventional blood hiv test',
  chlamydia: 'chlamydia test',
  gonorrhea: 'gonorrhea test',
  syphilis: 'syphilis test',
  hepB: 'hepatitis b test',
  hepC: 'hepatitis c test',
  rapidHIV: 'rapid blood hiv test',
  herpes: 'herpes test'
};

const vaccinesMap = {
  hepB: 'hepatitis b vaccine',
  hepA: 'hepatitis a vaccine',
  hpv: 'hpv vaccine'
}

const getTestsAndVaccines = (serviceString) => {
  // Strip category headers from string
  const servicesArray = serviceString.toLowerCase().split(',').map((service) => {
    if (service.indexOf('*') >= 0) {
      return service.split('*')[1];
    }
    return service;
  });

  const cleanServices = {};
  Object.keys(serviceMap).forEach((key) => {
    cleanServices[key] = servicesArray.indexOf(serviceMap[key]) >= 0;
  });

  const cleanVaccines = {};
  Object.keys(vaccinesMap).forEach((key) => {
    cleanVaccines[key] = servicesArray.indexOf(vaccinesMap[key]) >= 0;
  });

  return { tests: cleanServices, vaccines: cleanVaccines };
};

const feeTranslationMap = {
  lowCost: 'lowcost',
  donationsAccepted: 'donations accepted',
  fee: 'fee',
  noFee: 'no fee',
  insuranceAccepted: 'insurance accepted',
  medicaidAccepted: 'medicaid accepted',
  medicareAccepted: 'medicare accepted',
  slidingScale: 'sliding scale',
  prepForUninsured: 'prep for uninsured',
  freeHepBTest: 'free hepatitis b testing',
  freeHepCTest: 'free hepatitis c testing',
  freeHIVTest: 'free hiv testing',
  freeSTDTest: 'free std testing',
  freeTBTest: 'free tb testing'
};

const getFees = (feeString) => {
  const feesArray = feeString.trim().toLowerCase().split(',');

  const translatedFees = {};
  Object.keys(feeTranslationMap).forEach((key) => {
    translatedFees[key] = feesArray.indexOf(feeTranslationMap[key]) >= 0;
  });

  return translatedFees;
};


const bottomLeftLimit = [23.459932, -126.405826];
const upperRightLimit = [50.199775, -53.350108];
const SQUARE_SIZE = 6;
const GUARDRAIL_LIMIT = 900;
module.exports.fetchClinics = async () => {
  let aggArray = [];

  const coordinateSquare = new CoordinateSquare(bottomLeftLimit, upperRightLimit, SQUARE_SIZE);

  for (let i = 0; i < GUARDRAIL_LIMIT; i++) {
    try {
      console.log(coordinateSquare.bottomLeftLat, coordinateSquare.bottomLeftLong);
      const randomTime = Math.floor(Math.random() * 10000);
      await pause(randomTime);
      const response = await fetchClinics(coordinateSquare);
      console.log('Response length', response.data && response.data.features && response.data.features.length);

      const cleanedData = cleanData(response.data.features);
      aggArray = aggArray.concat(cleanedData);
    } catch (err) {
      console.log('Error getting response from ', coordinateSquare, err);
    }

    // Scan left to right, bottom to top across map
    if (coordinateSquare.endOfHorizontalLimit()) {
      // Reached end of row, move down one row and reset to first column of map
      console.log('Reached end of row, resetting column position');

      if (coordinateSquare.endOfVerticalLimit()) {
        console.log('Reached last row, breaking out');
        console.log('Final state', coordinateSquare, 'iteration count', i);
        break;
      }

      coordinateSquare.resetHorizontal();
      coordinateSquare.moveVertically(1);
    } else {
      coordinateSquare.moveHorizontally(1);
    }
  }

  fs.writeFile('./output.json', JSON.stringify(aggArray), function (err) {
    if (err) {
      console.error(err);
      console.log(aggArray); // Backup stdout
    }
    console.log('The file was saved');
  });
};
