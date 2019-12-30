import "regenerator-runtime/runtime";
import trim from "lodash/trim";
import Axios from "axios";
import fs from 'fs';

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

class CoordinateSquare {
    constructor(upperLeftLimit, bottomRightLimit, squareSize) {
        this.upperLeftLimit = upperLeftLimit;
        this.bottomRightLimit = bottomRightLimit;
        this.squareSize = squareSize;

        this.upperLeftLat = upperLeftLimit[0];
        this.upperLeftLong = upperLeftLimit[1];
    }

    get bottomRightLat() {
        return this.upperLeftLat + this.squareSize;
    }

    get bottomRightLong() {
        return this.upperLeftLong + this.squareSize;
    }

    moveHorizontally(units) {
        this.upperLeftLong += (this.squareSize * units)
    }

    moveVertically(units) {
        this.upperLeftLat += (this.squareSize * units)
    }

    resetHorizontal() {
        this.upperLeftLong = upperLeftLimit[1];
    }

    endOfHorizontalLimit() {
        return this.bottomRightLong >= this.bottomRightLimit[1];
    }

    endOfVerticalLimit() {
        return this.bottomRightLat <= this.bottomRightLimit[0];
    }
}

const upperLeftLimit = [48.88505764327357, -119.25743761175723];
const bottomRightLimit = [24.33708401591122, -67.33708401595122];
const SQUARE_SIZE = 5;
const GUARDRAIL_LIMIT = 100;
const walk = async () => {
    let aggArray = [];

    const coordinateSquare = new CoordinateSquare(upperLeftLimit, bottomRightLimit, SQUARE_SIZE);

    for (let i = 0; i < GUARDRAIL_LIMIT; i++) {
        try {
            console.log('coordinateSquare', coordinateSquare.upperLeftLat, coordinateSquare.upperLeftLong);
            const randomTime = Math.floor(Math.random() * 10000);
            await pause(randomTime);
            const response = await fetchClinics(coordinateSquare);
            console.log("Response length", response.data && response.data.features && response.data.features.length);

            const cleanedData = cleanData(response.data.features);
            aggArray = aggArray.concat(cleanedData);
        } catch (err) {
            console.log("Error getting response from ", coordinateSquare, err);
        }

        // Scan left to right, top to bottom across map
        if (coordinateSquare.endOfHorizontalLimit()) {
            //Reached end of row, move down one row and reset to first column of map
            console.log("Reached end of row, resetting column position");

            if (coordinateSquare.endOfVerticalLimit()) {
                console.log("Reached last row, breaking out");
                console.log("Final state", coordinateSquare, 'iteration count', i)
                break;
            }

            coordinateSquare.resetHorizontal();
            coordinateSquare.moveVertically(-1);
        } else {
            coordinateSquare.moveHorizontally(1);
        }
    }

    fs.writeFile("output.json", JSON.stringify(aggArray), function (err) {
        if (err) {
            console.log("Couldn't write to file, writing to console instead", aggArray);
            throw err;
        }
        console.log('Complete');
    });
}

const fetchClinics = async (coordinateSquare) => {
    const url = `https://npin.cdc.gov/api/organization/gettested/json/${coordinateSquare.upperLeftLat}--${coordinateSquare.bottomRightLat}/${coordinateSquare.upperLeftLong}--${coordinateSquare.bottomRightLong}`;
    console.log("url" ,url)
    const options = {
        method: 'get',
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36",
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            "Host": "npin.cdc.gov",
            "Origin": "https://gettested.cdc.gov",
            "Referer": "https://gettested.cdc.gov/search_results"
        },
        url
    };

    return Axios(options);
}

const cleanData = (features) => features.map(feature => {
    const cleanName = feature.properties.name && feature.properties.name.replace(/<[^>]+>/g, '').replace(/\|/g, " ").trim();
    let cleanWebsite = feature.properties.gsl_props_web_rendered && feature.properties.gsl_props_web_rendered.replace(/\|/g, " ").trim();
    if (cleanWebsite && !cleanWebsite.match(/https?:\/\//)) {
        cleanWebsite = "http://" + cleanWebsite;
    }

    return {
        id: feature.properties.nid,
        name: cleanName,
        address: trim(feature.properties.description),
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        phone: feature.properties.gsl_props_phone_rendered.replace && feature.properties.gsl_props_phone_rendered.replace(/\D/g, ''),
        website: cleanWebsite,
        ...getServices(feature.properties.gsl_feature_filter_list_rendered),
        ...getFees(feature.properties.fees)
    };
});

const serviceTranslationMap = {
    hivTest: 'conventional blood hiv test',
    chlamydiaTest: 'chlamydia test',
    gonorrheaTest: 'gonorrhea test',
    syphilisTest: 'syphilis test',
    hepBTest: 'hepatitis b test',
    hepCTest: 'hepatitis c test',
    rapidHIVTest: 'rapid blood hiv test',
    herpesTest: 'herpes test',
    hepBVaccineTest: 'hepatitis b vaccine',
    hepAVaccineTest: 'hepatitis a vaccine',
    hpvVaccineTest: 'hpv vaccine'
}

const getServices = (serviceString) => {
    //Strip category headers from string
    const servicesArray = serviceString.toLowerCase().split(",").map(service => {
        if (service.indexOf("*") >= 0) {
            return service.split("*")[1];
        }
        return service;
    });

    const cleanServices = {};
    Object.keys(serviceTranslationMap).forEach(key => {
        cleanServices[key] = servicesArray.indexOf(serviceTranslationMap[key]) >= 0
    });

    return cleanServices;
}

const feeTranslationMap = {
    lowCost: "lowcost",
    donationsAccepted: "donations accepted",
    fee: "fee",
    noFee: "no fee",
    insuranceAccepted: "insurance accepted",
    medicaidAccepted: "medicaid accepted",
    medicareAccepted: "medicare accepted",
    slidingScale: "sliding scale",
    prepForUninsured: "prep for uninsured",
    freeHepBTest: 'free hepatitis b testing',
    freeHepCTest: 'free hepatitis c testing',
    freeHIVTest: 'free hiv testing',
    freeSTDTest: 'free std testing',
    freeTBTest: 'free tb testing'
}

const getFees = (feeString) => {
    const feesArray = feeString.trim().toLowerCase().split(",");

    const translatedFees = {};
    Object.keys(feeTranslationMap).forEach(key => {
        translatedFees[key] = feesArray.indexOf(feeTranslationMap[key]) >= 0
    });

    return translatedFees;
}


walk();