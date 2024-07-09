// Define variables
let map;
let mostRecentCircle;
let guesses = JSON.parse(localStorage.getItem("guesses")) || [];
let tCircleArray = [];
let circles = JSON.parse(localStorage.getItem("circles")) || [];
let nullIsland = turf.circle([0, 0], 1, {
  steps: 5,
  units: "kilometers",
});
let union = turf.polygon(nullIsland.geometry.coordinates);

let coveredCountries = JSON.parse(localStorage.getItem("covered")) || [];
let COUNTRY_DATA;

const url = "../data/map.geojson";

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
  // Plot circles from localstorage
  circles.forEach((latlng) => {
    plotCircle(latlng.lat, latlng.lng);
  });
  fetchData(); // Call fetchData() to fetch country data and display it
}

// Get country GEOJson data
async function fetchData() {
  const response = await fetch(url);
  const data = await response.json();
  COUNTRY_DATA = data.features;
  countryDisplay(); // Call countryDisplay() after COUNTRY_DATA is assigned
}

// Function to plot circle on the map
function plotCircle(lat, lng) {
  // Check if theres a most recent circle
  if (mostRecentCircle) {
    // Change the colour of the most recent circle to orange
    mostRecentCircle.setOptions({
      strokeColor: "black", // Stroke colour
      fillColor: "#ffff", // Fill colour
    });
  }

  let rad = document.getElementById("radius").value;
  // Create circle and store as most recent
  mostRecentCircle = new google.maps.Circle({
    center: { lat, lng },
    radius: rad * 1000,
    map,
    strokeColor: "black", // Most recent guess stroke colour
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#682ae9", // Most recent guess fill colour
    fillOpacity: 0.5,
  });
}

// Function to check if guess covers whole country
function checkCoverage(tCircle) {
  // Make the guess circle a turf polygon
  const circlePoly = turf.polygon(tCircle.geometry.coordinates);
  // Merge together the guess tPoly and the current total guess mesh
  union = turf.union(circlePoly, union);
  COUNTRY_DATA.forEach((country) => {
    let countryID = country.properties.ISO2.toLowerCase();
    // if country already covered log already covered
    if (!coveredCountries.includes(countryID)) {
      const sect = turf.intersect(union, country);
      // If section covers country calc area
      if (sect !== null) {
        let sectArea = turf.area(sect);
        let countryArea = turf.area(country);
        const coverage = sectArea / countryArea
        // If country is fully covered by section
        if (coverage >= 0.99999) {
          // if country already covered skip else print country
          if (!coveredCountries.includes(countryID)) {
            coveredCountries.push(countryID);
            localStorage.setItem("covered", JSON.stringify(coveredCountries));
          }
        }
      }
    }
  });
}

// Function to display errors in the DOM
function displayError(message) {
  document.querySelector(".error-prompt").classList.add("shake");
  document.querySelector(".error-prompt").textContent = message;
  setTimeout(() => {
    document.getElementById("input").classList.remove("error");
    document.querySelector(".error-prompt").classList.remove("shake");
  }, 500);
}

// Function to display country arrays in the DOM and convert to flag spans
function countryDisplay() {
  let remainingCountries = [];
  COUNTRY_DATA.forEach((country) => {
    const countryID = country.properties.ISO2.toLowerCase();
    // if country already covered skip
    if (coveredCountries.includes(countryID)) {
      remainingCountries.filter((a) => a !== countryID);
    }
    // Else push country to array
    else {
      remainingCountries.push(countryID);
      localStorage.setItem("remaining", JSON.stringify(remainingCountries));
    }
  });

  const remainingFlags = remainingCountries.map(
    (id) => `<span class="fi fi-${id}"></span>`
  );

  const coveredFlags = coveredCountries.map(
    (id) => `<span class="fi fi-${id}"></span>`
  );

  document.querySelector(".countries-uncomplete").innerHTML =
    remainingFlags.join(" ");

  document.querySelector(".countries-complete").innerHTML =
    coveredFlags.join(" ");
}

//Function to make a guess
function guess() {
  // Get radius selected
  let rad = document.getElementById("radius").value;
  // Get the city name from the input
  let city = document.getElementById("input").value.toLowerCase();
  // Use the Google Maps Geocoding API to get the city's coordinates
  const geocoder = new google.maps.Geocoder();
  // Create bounding box for europe to limit results
  let north = 71.18929367132083;
  let east = 55.95521124002787;
  let south = 34.411544981184164;
  let west = -24.893037252867508;

  let bounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(south, west),
    new google.maps.LatLng(north, east)
  );

  geocoder.geocode(
    { address: city, bounds: bounds },
    function (results, status) {
      if (status !== "OK") {
        // alert("Invalid input. Please enter a valid place name.");
        displayError("Input is not a vaild location.");
      } else {
        const locality = results[0].types.includes("locality");
        const administrative = results[0].types.includes(
          "administrative_area_level_3"
        );
        if (locality || administrative) {

          let lat = results[0].geometry.location.lat();
          let lng = results[0].geometry.location.lng();
          let latlng = `${lng}, ${lat}`;
          let guess = results[0].address_components[0].long_name;
          // Get the latitude and longitude of the first result

          if (guesses.includes(latlng)) {
            displayError("Guess was already made.");
            // alert("guess already made");
          } else {
            guesses.push(latlng);
            circles.push({ lat: lat, lng: lng });
            localStorage.setItem("guesses", JSON.stringify(guesses));
            localStorage.setItem("circles", JSON.stringify(circles));
            document.getElementById("input").classList.remove("error");
            document.querySelector(".error-prompt").textContent = "";
            // Create a circle around the city with a selected radius in KM
            plotCircle(lat, lng);
            // Make a turf circle with the guess location
            const center = [lng, lat];
            const radius = rad;
            const options = {
              steps: 500,
              units: "kilometers",
            };
            const tCircle = turf.circle(center, radius, options);
            checkCoverage(tCircle);
            countryDisplay();
          }
        } else {
          // alert("Guess was not a town or city");
          displayError("Guess was not a town or city.");
        }
      }
    }
  );
  document.getElementById("input").value = "";
}

//Function to reload the page/reset
function reset() {
  localStorage.removeItem("circles");
  localStorage.removeItem("guesses");
  localStorage.removeItem("remaining");
  localStorage.removeItem("covered");

  location.reload();
}

//EventListener for enter key
input.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    guess();
  }
});
