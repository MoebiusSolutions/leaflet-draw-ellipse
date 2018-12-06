/*
const _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
            }
        }
    }

    return target;
};
*/

const ArcObjectWithoutProperties = function (obj, keys) {
    const target = {}

    for (const i in obj) {
        if (keys.indexOf(i) >= 0) continue
        if (!Object.prototype.hasOwnProperty.call(obj, i)) continue
        target[i] = obj[i]
    }

    return target
}


L.Arc = L.Polyline.extend({
    options: {
        weight: 5,
        color: '#ffff00',
        stroke: true
    },

    initialize: function initialize (_ref) {
        let _ref$center = _ref.center,
            center = _ref$center === undefined ? [0, 0] : _ref$center,
            _ref$radius = _ref.radius,
            radius = _ref$radius === undefined ? 100 : _ref$radius,
            _ref$startBearing = _ref.startBearing,
            startBearing = _ref$startBearing === undefined ? 0 : _ref$startBearing,
            _ref$endBearing = _ref.endBearing,
            endBearing = _ref$endBearing === undefined ? 90 : _ref$endBearing,
            _ref$numberOfPoints = _ref.numberOfPoints,
            numberOfPoints = _ref$numberOfPoints === undefined ? 32 : _ref$numberOfPoints,
            options = ArcObjectWithoutProperties(_ref, ['center', 'radius', 'startBearing', 'endBearing', 'numberOfPoints'])

        this.setOptions(options).setCenter(center).setRadius(radius).setStartBearing(startBearing).setEndBearing(endBearing).setNumberOfPoints(numberOfPoints)

        this._setLatLngs(this.getLatLngs())
    },

    getCenter: function getCenter () {
        return this._center
    },

    setCenter: function setCenter (center) {
        this._center = L.latLng(center)
        return this.redraw()
    },

    getRadius: function getRadius () {
        return this._radius
    },

    setRadius: function setRadius () {
        const radius = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 100

        this._radius = Math.abs(radius)
        return this.redraw()
    },

    getStartBearing: function getStartBearing () {
        return this._startBearing
    },

    setStartBearing: function setStartBearing () {
        let startBearing = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0

        /**
         * Not sure how much of these checks are neccessary
         * just using all as a temp fix for rotation problems.
         */
        let endBearing = this.getEndBearing() || 360

        while (startBearing < 0) {
            startBearing += 360
        }
        while (startBearing > 360) {
            startBearing -= 360
        }

        if (endBearing < startBearing) {
            while (endBearing <= startBearing) {
                startBearing = startBearing - 360
            }
        }

        this._startBearing = startBearing
        return this.redraw()
    },

    getEndBearing: function getEndBearing () {
        return this._endBearing
    },

    setEndBearing: function setEndBearing () {
        let endBearing = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 90

        /**
         * Not sure how much of these checks are neccessary
         * just using all as a temp fix for rotation problems.
         */
        let startBearing = this.getStartBearing() || 0

        while (endBearing < 0) {
            endBearing += 360
        }
        while (endBearing > 360) {
            endBearing -= 360
        }

        if (startBearing > endBearing) {
            while (startBearing >= endBearing) {
                endBearing += 360
            }
        }

        while (endBearing - startBearing > 360) {
            endBearing -= 360
        } this._endBearing = endBearing
        return this.redraw()
    },

    getNumberOfPoints: function getNumberOfPoints () {
        return this._numberOfPoints
    },

    setNumberOfPoints: function setNumberOfPoints () {
        const numberOfPoints = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 32

        this._numberOfPoints = Math.max(10, numberOfPoints)
        return this.redraw()
    },

    getOptions: function getOptions () {
        return this.options
    },

    setOptions: function setOptions () {
        const options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {}

        L.setOptions(this, options)
        return this.redraw()
    },

    getLatLngs: function getLatLngs () {
        const angle = this.getEndBearing() - this.getStartBearing()
        const ptCount = angle * this.getNumberOfPoints() / 360
        const latlngs = []
        const deltaAngle = angle / ptCount

        for (let i = 0; i < ptCount; i++) {
            const useAngle = this.getStartBearing() + deltaAngle * i
            latlngs.push(this.computeDestinationPoint(this.getCenter(), this.getRadius(), useAngle))
        }
        latlngs.push(this.computeDestinationPoint(this.getCenter(), this.getRadius(), this.getEndBearing()))
        return latlngs
    },


    setLatLngs: function setLatLngs (latLngs) {
        this._setLatLngs(this.getLatLngs())
        return this.redraw()
    },

    setStyle: L.Path.prototype.setStyle,


    computeDestinationPoint: function computeDestinationPoint () {
        const start = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { lat: 0, lng: 0 }
        const distance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1
        const bearing = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0
        const radius = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 6378137


        const bng = bearing * Math.PI / 180

        const lat1 = start.lat * Math.PI / 180
        const lon1 = start.lng * Math.PI / 180

        let lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / radius) + Math.cos(lat1) * Math.sin(distance / radius) * Math.cos(bng))

        let lon2 = lon1 + Math.atan2(Math.sin(bng) * Math.sin(distance / radius) * Math.cos(lat1), Math.cos(distance / radius) - Math.sin(lat1) * Math.sin(lat2))

        lat2 = lat2 * 180 / Math.PI
        lon2 = lon2 * 180 / Math.PI

        return {
            lat: lat2,
            lng: lon2
        }
    }
})

L.arc = function (_ref2) {
    let _ref2$center = _ref2.center,
        center = _ref2$center === undefined ? [0, 0] : _ref2$center,
        _ref2$radius = _ref2.radius,
        radius = _ref2$radius === undefined ? 100 : _ref2$radius,
        _ref2$startBearing = _ref2.startBearing,
        startBearing = _ref2$startBearing === undefined ? 0 : _ref2$startBearing,
        _ref2$endBearing = _ref2.endBearing,
        endBearing = _ref2$endBearing === undefined ? 90 : _ref2$endBearing,
        _ref2$numberOfPoints = _ref2.numberOfPoints,
        numberOfPoints = _ref2$numberOfPoints === undefined ? 32 : _ref2$numberOfPoints,
        options = ArcObjectWithoutProperties(_ref2, ['center', 'radius', 'startBearing', 'endBearing', 'numberOfPoints'])
    return new L.Arc(_extends({ center, radius, startBearing, numberOfPoints, endBearing }, options))
}
