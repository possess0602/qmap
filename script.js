'use strict';
// import { library, icon } from '@fortawesome/fontawesome-svg-core';
// import { faCamera } from '@fortawesome/free-solid-svg-icons';
// library.add(faCamera);
// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let mymap, mapEvent;
class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(distance, duration, coords) {
        this.distance = distance;
        this.duration = duration;
        this.coords = coords;
    }
    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
    }
}
class Running extends Workout {
    type = 'running';
    constructor(distance, duration, coords, cadence) {
        super(distance, duration, coords);
        this.cadence = cadence;
        this.calPace();
        this._setDescription();
    }
    calPace() {
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout {
    type = 'cycling';
    constructor(distance, duration, coords, elevationGain) {
        super(distance, duration, coords);
        this.elevationGain = elevationGain;
        this.calSpeed();
        this._setDescription();
    }
    calSpeed() {
        // km/h
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycling1);

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const clearAllIcon = document.querySelector('.fa-broom');
class App {
    #mymap;
    #mapEvent;
    #workout = [];
    #mapZoomLevel = 13;
    constructor() {
        // Get user's position
        this._getPosition();

        // Get data from local storage
        this._getLocalStorage();

        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
        containerWorkouts.addEventListener('click', this._removeAList.bind(this));
        containerWorkouts.addEventListener('click', this._updateAList.bind(this));
        clearAllIcon.addEventListener('click', this._reset.bind(this));
    }
    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function() {
                    alert('Could not get your position');
                }
            );
        }
    }
    _loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;
        const coords = [latitude, longitude];

        // initialize the map on the "map" div with a given center and zoom
        this.#mymap = L.map('map').setView(coords, this.#mapZoomLevel);
        // L.tileLayer(
        //     'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        //         attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        //         maxZoom: 20,
        //         id: 'mapbox/streets-v11',
        //         tileSize: 512,
        //         zoomOffset: -1,
        //         accessToken: 'pk.eyJ1IjoicG9zc2VzczA5MTAiLCJhIjoiY2tybHJ5aXZhMTJxdDJ2bGkzd2ZiMHdvcSJ9.DnkCb3AEdwGHlcSBMEiJKA',
        //     }
        // ).addTo(this.#mymap);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 20,
        }).addTo(this.#mymap);
        this.#mymap.on('click', this._showForm.bind(this));
        this.#workout.forEach(work => {
            this._renderWorkoutMarker(work);
        });
        //  if (!this.#workout) return;
        //  this.#workout.forEach(work => {
        //    this._renderWorkoutMarker(work);
        //  });
    }
    _showForm(mapE) {
        this.#mapEvent = mapE;
        inputDistance.focus();
        //  console.log(mapEvent);
        form.classList.remove('hidden');
    }
    _hideForm() {
        // Empty inputs
        inputDistance.value =
            inputDuration.value =
            inputCadence.value =
            inputElevation.value =
            '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1000);
    }
    _toggleElevationField() {
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkout(e) {
        e.preventDefault();
        const validInput = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout; // If workout running, create running object

        if (type === 'running') {
            const cadence = +inputCadence.value;
            if (
                //   !Number.isFinite(distance) ||
                //   !Number.isFinite(duration) ||
                //   !Number.isFinite(cadence)
                !validInput(distance, duration, cadence) ||
                !allPositive(distance, duration, cadence)
            )
                return alert('Input shave to be positive number!');
            workout = new Running(distance, duration, [lat, lng], cadence);
        }
        // Check if data is valid

        // If workout cycling, create cycling object
        if (type === 'cycling') {
            const elevationGain = +inputElevation.value;
            if (!validInput(distance, duration, elevationGain) ||
                !allPositive(distance, duration)
            )
                return alert('Input shave to be positive number!');

            workout = new Cycling(distance, duration, [lat, lng], elevationGain);
        }
        // Add new object to workout array
        this.#workout.push(workout);
        //  console.log(workout);
        // Render workout on map as marker
        this._renderWorkoutMarker(workout);

        // Render workout on list
        this._renderWorkout(workout);
        // Hide form + clear input fields
        this._hideForm();
        // Set local storage to all workouts
        this._setLocalStorage();
    }
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#mymap)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(
                `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
            )
            .openPopup();
    }

    _renderWorkout(workout) {
        let html = `
    
     <li class="workout workout--${workout.type}" data-id="${workout.id}">
     
     <h2 class="workout__title">${
       workout.description
     }<span style="color: Tomato; float: right;">
     <i class="fas fa-trash-alt fa-1x" ></i>
     </span>
     <span style="color: white; float: right; position:relative; right:20px">
     <i class="fas fa-edit"></i>
     </span>
     </h2>
      
       <div class="workout__details">
       <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
         <span class="workout__value">${workout.distance}</span>
         <span class="workout__unit">km</span>
       </div>
       <div class="workout__details">
         <span class="workout__icon">⏱</span>
         <span class="workout__value">${workout.duration}</span>
         <span class="workout__unit">min</span>
       </div>
   `;

        if (workout.type === 'running')
            html += `
       <div class="workout__details">
         <span class="workout__icon">⚡️</span>
         <span class="workout__value">${workout.pace.toFixed(1)}</span>
         <span class="workout__unit">min/km</span>
       </div>
       <div class="workout__details">
         <span class="workout__icon">🦶🏼</span>
         <span class="workout__value">${workout.cadence}</span>
         <span class="workout__unit">spm</span>
       </div>
     </li>
     `;

        if (workout.type === 'cycling')
            html += `
       <div class="workout__details">
         <span class="workout__icon">⚡️</span>
         <span class="workout__value">${workout.speed.toFixed(1)}</span>
         <span class="workout__unit">km/h</span>
       </div>
       <div class="workout__details">
         <span class="workout__icon">⛰</span>
         <span class="workout__value">${workout.elevationGain}</span>
         <span class="workout__unit">m</span>
       </div>
     </li>
     `;
        form.insertAdjacentHTML('afterend', html);
    }
    _renderDeleteWorkout(e, id) {
        const parentNode = document.getElementById(id);
        e.target.closest('.workout').setAttribute('id', id);
        document.getElementById(id).remove(parentNode);
    }
    _moveToPopup(e) {
        // console.log(e.target);
        const workoutEl = e.target.closest('.workout');
        let workout;
        // console.log(workoutEl);
        if (!workoutEl) return;
        //  const workout = this.#workout;
        //  console.log(workout);
        workout = this.#workout.find(work => work.id === workoutEl.dataset.id);

        this.#mymap.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });
    }
    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workout));
    }
    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        if (!data) return;
        this.#workout = data;
        this.#workout.forEach(work => this._renderWorkout(work));
    }
    _removeAList(e) {
        if (e.target.className !== 'fas fa-trash-alt fa-1x') return;
        const deleteEl = e.target.closest('.workout');
        let workout;
        if (!deleteEl) return;
        if (e.target) {
            workout = this.#workout.find(work => work.id === deleteEl.dataset.id);
            // console.log(workout.id);
        }
        const localWorkout = JSON.parse(localStorage.getItem('workouts'));
        localWorkout.forEach((value, index) => {
            if (value.id === workout.id) {
                this.#workout.splice(index, 1);
                this._setLocalStorage();
            }
        });
        this._renderDeleteWorkout(e, workout.id);
    }
    _updateAList(e) {
        // e.preventDefault();

        if (e.target.className !== 'fas fa-edit') return;
        const updateEl = e.target.closest('.workout');
        if (!updateEl) return;

        const workout = this.#workout.find(work => work.id === updateEl.dataset.id);
        // console.log(workout.id);

        this._showForm();

        // console.log(
        //     workout.type,
        //     workout.distance,
        //     workout.duration,
        //     workout ? .cadence ? ? workout.elevationGain
        // );
        const payload = {
            id: workout.id,
            type: workout.type,
            distance: workout.distance,
            duration: workout.duration,
            other: workout ?.cadence ?? workout.elevationGain
        };
        this._newWorkout.bind(payload);
        this._fillOriginData(e, payload);
    }
    _fillOriginData(e, workout) {
        e.preventDefault();
        document.querySelector('.form__input--type').setAttribute('disabled', '');
        if (workout) {
            inputType.value = workout.type;
            inputDistance.value = workout.distance;
            inputDuration.value = workout.duration;

            if (workout.type === 'cycling') {
                inputElevation.value = workout.other;
                inputCadence.closest('.form__row').classList.add('form__row--hidden');
                inputElevation
                    .closest('.form__row')
                    .classList.remove('form__row--hidden');
            }
            if (workout.type === 'running') {
                inputCadence.value = workout.other;
                inputCadence
                    .closest('.form__row')
                    .classList.remove('form__row--hidden');
                inputElevation.closest('.form__row').classList.add('form__row--hidden');
            }
        }

        const updateIndex = this.#workout.findIndex(item => item.id == workout.id);
        // console.log(this.#workout[updateIndex].id);
        form.addEventListener('submit', e => {
            e.preventDefault();
            const validInput = (...inputs) =>
                inputs.every(inp => Number.isFinite(inp));
            const allPositive = (...inputs) => inputs.every(inp => inp > 0);

            const type = inputType.value;
            const distance = +inputDistance.value;
            const duration = +inputDuration.value;

            if (type === 'running') {
                const cadence = +inputCadence.value;
                if (!validInput(distance, duration, cadence) ||
                    !allPositive(distance, duration, cadence)
                )
                    return alert('Input shave to be positive number!');
                this.#workout[updateIndex].type = type;
                this.#workout[updateIndex].distance = distance;
                this.#workout[updateIndex].duration = duration;
                this.#workout[updateIndex].cadence = cadence;
            }

            if (type === 'cycling') {
                const elevationGain = +inputElevation.value;
                // console.log(elevationGain);
                if (!validInput(distance, duration, elevationGain) ||
                    !allPositive(distance, duration)
                )
                    return alert('Input shave to be positive number!');
                this.#workout[updateIndex].type = type;
                this.#workout[updateIndex].distance = distance;
                this.#workout[updateIndex].duration = duration;
                this.#workout[updateIndex].elevationGain = elevationGain;
            }
            this._setLocalStorage();
            this._hideForm();
            location.reload();
        });
    }
    _reset() {
        localStorage.removeItem('workouts');

        let element = document.querySelector('.workouts');
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
}

const app = new App();