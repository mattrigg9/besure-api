import { Dictionary } from '../types';
import { getDistance } from '../utils';

class Clinic {
  id: string;
  name: string;
  address: string;
  website: string;
  latitude: number;
  longitude: number;
  phone: string;
  tests: Dictionary<boolean>;
  vaccines: Dictionary<boolean>;
  fees: Dictionary<boolean>;

  // Explicit attribute assignment intentional
  // to pick attributes from DB query results
  constructor(options: Dictionary<any>) {
    this.id = options.id;
    this.name = options.name;
    this.address = options.address;
    this.website = options.website;
    this.latitude = options.latitude;
    this.longitude = options.longitude;
    this.phone = options.phone;
    this.tests = options.tests;
    this.vaccines = options.vaccines;
    this.fees = options.fees;
  }

  getDistance(latitude: number, longitude: number): number {
    return getDistance(latitude, longitude, this.latitude, this.longitude);
  }
}

export default Clinic;
