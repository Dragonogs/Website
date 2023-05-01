// Define variables
let map;
let guesses = [];
let tCircleArray = [];
let coordArray = [];
let nullIsland = turf.circle([0, 0], 1, {
  steps: 5,
  units: "kilometers",
  properties: { foo: "bar" },
});
let union = turf.polygon(nullIsland.geometry.coordinates);

let coveredCountries = [];
let COUNTRY_DATA;

const url = "../data/map.geojson";

// Get country GEOJson data
async function fetchData() {
  const response = await fetch(url);
  const data = await response.json();
  COUNTRY_DATA = data.features;
  countryDisplay(); // Call countryDisplay() after COUNTRY_DATA is assigned
}

// Initialize Google Maps
function initMap() {
  // Set initial map center
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 50.43683767611142, lng: 11.646820736967626 },
    zoom: 5,
    streetViewControl: false,
    mapTypeControl: false,
    styles: [
      {
        featureType: "all",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ],
  });
  fetchData(); // Call fetchData() to fetch country data and display it
}

//Function to make a guess
function guess() {
  // Get radius selected
  let rad = document.getElementById("radius").value;
  // Get the city name from the input
  let city = document.getElementById("input").value;
  // Use the Google Maps Geocoding API to get the city's coordinates
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: city }, function (results, status) {
    if (status !== "OK") {
      alert("Invalid input. Please enter a valid place name.");
    } else {
      console.log(results);
      const locality = results[0].types.includes("locality");
      const administrative = results[0].types.includes(
        "administrative_area_level_3"
      );
      if (locality || administrative) {
        // Get the latitude and longitude of the first result
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();
        const latlng = `${lng}, ${lat}`;
        if (guesses.includes(latlng)) {
          alert("guess already made");
        } else {
          guesses.push(latlng);
          // Create a circle around the city with a selected radius in KM
          new google.maps.Circle({
            center: { lat, lng },
            radius: rad * 1000, //Times 1000 to convert to kilometer
            map,
            strokeColor: "#4a69c8 ",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#5c84ff",
            fillOpacity: 0.7,
          });
          // Make a turf circle with the guess location
          const center = [lng, lat];
          const radius = rad;
          const options = {
            steps: 50,
            units: "kilometers",
            properties: { foo: "bar" },
          };
          const tCircle = turf.circle(center, radius, options);
          checkCoverage(tCircle);
          countryDisplay();
        }
      } else {
        alert("Guess was not a town or city");
        console.log(results);
      }
    }
  });
  document.getElementById("input").value = "";
}

function countryDisplay() {
  let requiredCountries = [];
  COUNTRY_DATA.forEach((country) => {
    const countryID = country.properties.ISO2.toLowerCase();
    // if country already covered skip
    if (coveredCountries.includes(countryID)) {
      requiredCountries.filter((a) => a !== countryID);
      console.log("removed", countryID);
    }
    // Else push country to array
    else {
      requiredCountries.push(countryID);
    }
  });

  document.querySelector(".countries-uncomplete").textContent =
    requiredCountries.join(", ");

  document.querySelector(".countries-complete").textContent =
    coveredCountries.join(", ");

  if (COUNTRY_DATA.length / 2 > coveredCountries.length) {
    console.log("less than half covered");
  } else {
    console.log("over half covered");
  }
}

// Function to check if guess covers whole country
function checkCoverage(tCircle) {
  // Make the guess circle a turf polygon
  const circlePoly = turf.polygon(tCircle.geometry.coordinates);
  // Merge together the guess tPoly and the current total guess mesh
  union = turf.union(circlePoly, union);
  COUNTRY_DATA.forEach((country) => {
    let countryID = country.properties.ISO2.toLowerCase();
    if (countryID == "bg") {
      console.log(country);
    }
    // if country already covered log already covered
    if (coveredCountries.includes(countryID)) {
      console.log(`${countryID} already covered`);
    }
    // else calc area
    else {
      const sect = turf.intersect(union, country);
      // If section covers country calc area
      if (sect !== null) {
        let sectArea = Math.round(turf.area(sect));
        let countryArea = Math.round(turf.area(country));
        if (sectArea == 111065498183 && countryID == "bg") {
          sectArea = 111065498203;
        }
        if (sectArea == 64456758251 && countryID == "lv") {
          sectArea = 64456758494;
        }
        console.log(`${countryID} area: `, countryArea);
        console.log(`${countryID} section area: `, sectArea);
        // If country is fully covered by section
        if (sectArea >= countryArea) {
          // if country already covered skip else print country
          if (!coveredCountries.includes(countryID)) {
            coveredCountries.push(countryID);
            console.log(`${countryID} 100% covered`);
          }
        }
        if (sectArea < countryArea) {
          const percentCovered = (sectArea / countryArea) * 100;
          console.log(`${countryID} ${percentCovered.toFixed(2)}% covered`);
        }
      } else {
        // console.log(`${countryID} not covered`);
      }
    }
  });
}

//Function to reload the page/reset
function reset() {
  // initMap()
  location.reload();
}

//EventListener for enter key
input.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    guess();
  }
});
