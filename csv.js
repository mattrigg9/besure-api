const output = require('./output.json');
const fs = require('fs');
let csv = '';

console.log('Output Length', output.length);

output.forEach((clinic, i ) => {
    if (i === 0) {
        csv+= ['latitude', 'longitude'].join(',')
        csv += '\n';
    }
    csv += [clinic.latitude, clinic.longitude].join(',')
    csv += '\n';
})

fs.writeFile('./test.csv', csv, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log('The file was saved!');
}); 

