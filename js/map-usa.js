// Define variables
let map;
let mostRecentCircle;
let guesses = JSON.parse(localStorage.getItem("guessesUS")) || [];
let tCircleArray = [];
let circles = JSON.parse(localStorage.getItem("circlesUS")) || [];
let nullIsland = turf.circle([0, 0], 1, {
  steps: 5,
  units: "kilometers",
  properties: { foo: "bar" },
});
let union = turf.polygon(nullIsland.geometry.coordinates);

let coveredCountries = JSON.parse(localStorage.getItem("coveredUS")) || [];
let COUNTRY_DATA;

const url = "../data/usa-map.geojson";

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
    center: { lat: 37.82832118183827, lng: -98.57949042881638 },
    zoom: 4.5,
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

//Function to make a guess
function guess() {
  // Get radius selected
  let rad = document.getElementById("radius").value;
  // Get the city name from the input
  let city = document.getElementById("input").value.toLowerCase();
  // Use the Google Maps Geocoding API to get the city's coordinates
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode(
    { address: city, componentRestrictions: { country: "US" } },
    function (results, status) {
      if (status !== "OK") {
        displayError("Input not vaild location.");
        console.log(results);
      } else {
        const locality = results[0].types.includes("locality");
        const administrative = results[0].types.includes(
          "administrative_area_level_3"
        );
        if (locality || administrative) {
          let lat;
          let lng;
          let latlng;
          let guess;

          console.log(results);
          lat = results[0].geometry.location.lat();
          lng = results[0].geometry.location.lng();
          latlng = `${lng}, ${lat}`;
          guess = results[0].address_components[0].long_name;

          // Get the latitude and longitude of the first result

          if (guesses.includes(latlng)) {
            displayError("Guess was already made.");
            // alert("guess already made");
          } else {
            guesses.push(latlng);
            circles.push({ lat: lat, lng: lng });
            localStorage.setItem("guessesUS", JSON.stringify(guesses));
            localStorage.setItem("circlesUS", JSON.stringify(circles));
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
              properties: { foo: "bar" },
            };
            const tCircle = turf.circle(center, radius, options);
            checkCoverage(tCircle);
            countryDisplay();
          }
        } else {
          // alert("Guess was not a town or city");
          displayError("Guess was not a town or city.");
          console.log(results);
        }
      }
    }
  );
  document.getElementById("input").value = "";
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

function displayError(message) {
  document.getElementById("input").classList.add("error");
  document.querySelector(".error-prompt").textContent = message;
}

function countryDisplay() {
  let remainingCountries = [];
  COUNTRY_DATA.forEach((country) => {
    const countryID = country.id.toUpperCase();
    // if country already covered skip
    if (coveredCountries.includes(countryID)) {
      remainingCountries.filter((a) => a !== countryID);
    }
    // Else push country to array
    else {
      remainingCountries.push(countryID);
      localStorage.setItem("remainingUS", JSON.stringify(remainingCountries));
    }
  });

  // const remainingFlags = remainingCountries.map(
  //   (id) => `<span class="fi fi-${id}"></span>`
  // );

  // const coveredFlags = coveredCountries.map(
  //   (id) => `<span class="fi fi-${id}"></span>`
  // );

  document.querySelector(".countries-uncomplete").innerHTML =
    remainingCountries.join(", ");

  document.querySelector(".countries-complete").innerHTML =
    coveredCountries.join(", ");
}

// Function to check if guess covers whole country
function checkCoverage(tCircle) {
  // Make the guess circle a turf polygon
  const circlePoly = turf.polygon(tCircle.geometry.coordinates);
  // Merge together the guess tPoly and the current total guess mesh
  union = turf.union(circlePoly, union);
  COUNTRY_DATA.forEach((country) => {
    let countryID = country.id.toUpperCase();
    // if country already covered log already covered
    if (!coveredCountries.includes(countryID)) {
      const sect = turf.intersect(union, country);
      // If section covers country calc area
      if (sect !== null) {
        let sectArea = Math.round(turf.area(sect));
        let countryArea = Math.round(turf.area(country));
        // If country is fully covered by section
        if (sectArea >= countryArea) {
          // if country already covered skip else print country
          if (!coveredCountries.includes(countryID)) {
            coveredCountries.push(countryID);
            localStorage.setItem("coveredUS", JSON.stringify(coveredCountries));
          }
        }
        if (sectArea < countryArea) {
          const percentCovered = (sectArea / countryArea) * 100;
        }
      }
    }
  });
}

//Function to reload the page/reset
function reset() {
  localStorage.removeItem("circlesUS");
  localStorage.removeItem("guessesUS");
  localStorage.removeItem("remainingUS");
  localStorage.removeItem("coveredUS");

  location.reload();
}

//EventListener for enter key
input.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    guess();
  }
});
