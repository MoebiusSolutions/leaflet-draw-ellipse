const
    RAD_TO_DEG = 180 / Math.PI,
    DEG_TO_RAD = Math.PI / 180

const wrapBrg = (brg) => {
    if (brg < 0.0) {
        brg += 360.0
        wrapBrg(brg)
    }
    else if (brg > 360.0) {
        brg -= 360.0
        wrapBrg(brg)
    }
    return brg
}


const atan2d = (y, x) => RAD_TO_DEG * Math.atan2(y, x)

const closeToZero = (x) => (Math.abs(x) < 0.0000000001 ? 0 : x)

L.Ellipse = L.Polyline.extend({
    options: {
        weight: 5,
        color: '#ffff00',
        stroke: true
    },

    initialize (latlng, radii, tilt, options) {
        L.setOptions(this, options)
        this._center = latlng
        this._numberOfPoints = 61
        this._startBearing = 0
        this._endBearing = 360

        if (tilt) {
            this._tiltDeg = tilt
        } else {
            this._tiltDeg = 0
        }

        if (radii) {
            this._semiMajor = radii[0]
            this._semiMinor = radii[1]
        }
        this.setLatLngs()
    },

    getCenter: function getCenter () {
        return this._center
    },

    setCenter: function setCenter (center = { lat: 0, lng: 0 }) {
        this._center = center
        return this.redraw()
    },

    setRadii: function setRadii (radii) {
        this._semiMajor = radii[0]
        this._semiMinor = radii[1]
        return this.redraw()
    },

    getRadii: function getRadii () {
        return [this._semiMajor, this._semiMinor]
    },

    setSemiMinor: function setSemiMinor (val) {
        this._semiMinor = val
        return this.redraw()
    },

    getSemiMinor: function getSemiMinor () {
        return this._semiMinor
    },

    setSemiMajor: function setSemiMajor (val) {
        this._semiMajor = val
        return this.redraw()
    },

    getSemiMajor: function getSemiMajor () {
        return this._semiMajor
    },

    setTilt: function setTilt (tilt) {
        this._tiltDeg = tilt
        return this.redraw()
    },

    getTilt: function getTilt () {
        return this._tiltDeg
    },

    setStartBearing: function setStartBearing (brg) {
        let startBearing = brg || 0
        /**
         * Not sure how much of these checks are neccessary
         * just using all as a temp fix for rotation problems.
         */
        const endBearing = this.getEndBearing() || 360

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

    getStartBearing: function getStartBearing () {
        return this._startBearing
    },


    setEndBearing: function setEndBearing (brg) {
        let endBearing = brg || 90

        /**
         * Not sure how much of these checks are neccessary
         * just using all as a temp fix for rotation problems.
         */
        const startBearing = this.getStartBearing() || 0

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

    getEndBearing: function getEndBearing () {
        return this._endBearing
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

    setOptions: function setOptions (options) {
        const ops = options || {}
        L.setOptions(this, ops)
        return this.redraw()
    },

    getLatLngs: function getLatLngs () {
        let angle, x, y
        const latlngs = []
        let brg = wrapBrg(this.getTilt())
        const start = wrapBrg(this.getStartBearing())
        let diff = this.getEndBearing() - start
        if (diff < 0) {
            diff += 360
        }
        const delta = (diff / (this._numberOfPoints - 1))

        if (this._semiMinor === this._semiMajor) {
            brg = 0
        }

        const trueStart = wrapBrg(brg + start)
        //start = wrapBrg(450 - start)
        for (let i = 0; i < this._numberOfPoints; i++) {
            angle = start + (i * delta)
            if (angle >= 360.0) {
                angle -= 360.0
            }

            y = this._semiMinor * Math.sin(angle * DEG_TO_RAD)
            x = this._semiMajor * Math.cos(angle * DEG_TO_RAD)
            const tangle = closeToZero((this._semiMinor !== this._semiMajor ? atan2d(y, x) : i * delta))
            const dist = Math.sqrt(x * x + y * y)
            const pos = this.computeDestinationPos(this.getCenter(), dist, trueStart + tangle)
            //const tpos = this.getPos(this.getCenter(), angle, trueStart, this.getSemiMinor(), this.getSemiMajor())
            latlngs.push(pos)

        }

        return latlngs
    },

    getPos: function getPos (center, angle, trueStart, semiMinor, semiMajor) {
        const y = semiMinor * Math.cos(angle * DEG_TO_RAD)
        const x = semiMajor * Math.sin(angle * DEG_TO_RAD)
        const tangle = closeToZero((semiMinor !== semiMajor ? atan2d(y, x) : -angle))

        const dist = Math.sqrt(x * x + y * y)
        return (this.computeDestinationPos(center, dist, trueStart + tangle))
    },

    getLatRadius () {
        return (this._semiMinor / 40075017) * 360
    },

    getLngRadius () {
        return ((this._semiMajor / 40075017) * 360) / Math.cos((Math.PI / 180) * this._latlngs.lat)
    },


    setLatLngs: function setLatLngs (latlngs = this.getLatLngs()) {
        this._setLatLngs(latlngs)
        return this.redraw()
    },

    setStyle: L.Path.prototype.setStyle,

    computeDestinationPos: function computeDestinationPos () {
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

L.ellipse = function (latlng, radii, tilt, options) {
    return new L.Ellipse(latlng, radii, tilt, options)
}
