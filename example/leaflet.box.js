
const boxObjectWithoutProperties = function (obj, keys) {
    const target = {}

    for (const i in obj) {
        if (keys.indexOf(i) >= 0) continue
        if (!Object.prototype.hasOwnProperty.call(obj, i)) continue
        target[i] = obj[i]
    }

    return target
}


L.Box = L.Polygon.extend({
    options: {
        fill: true,
        fillColor: '#ffff00',
        fillOpacity: 0.2
    },

    initialize: function initialize (_ref) {
        let _ref$center = _ref.center,
            center = _ref$center === undefined ? [0, 0] : _ref$center,
            _ref$width = _ref.width,
            width = _ref$width === undefined ? 100 : _ref$width,
            _ref$length = _ref.length,
            length = _ref$length === undefined ? 1000 : _ref$length,
            _ref$bearing = _ref.bearing,
            bearing = _ref$bearing === undefined ? 0 : _ref$bearing,
            options = boxObjectWithoutProperties(_ref, ['center', 'width', 'length', 'bearing'])

        this.setOptions(options).setCenter(center).setWidth(width).setLength(length).setBearing(bearing)

        this._setLatLngs(this.getLatLngs())
    },

    getCenter: function getCenter () {
        return this._center
    },

    setCenter: function setCenter (center) {
        this._center = L.latLng(center)
        return this.redraw()
    },

    getWidth: function getWidth () {
        return this._width
    },

    setWidth: function setWidth () {
        const width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 100

        this._width = Math.abs(width)
        return this.redraw()
    },

    getLength: function getLength () {
        return this._length
    },

    setLength: function setLength () {
        const length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 100

        this._length = Math.abs(length)
        return this.redraw()
    },

    getBearing: function getBearing () {
        return this._bearing
    },

    setBearing: function setBearing () {
        const bearing = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0

        this._bearing = bearing % 360
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
        const latLngs = []

        const hypotenuse = Math.sqrt(Math.pow(this.getWidth() / 2, 2) + Math.pow(this.getLength() / 2, 2))

        latLngs.push(this.computeDestinationPoint(this.getCenter(), hypotenuse, this.getBearing() - Math.atan2(this.getWidth(), this.getLength()) * 180 / Math.PI))
        latLngs.push(this.computeDestinationPoint(this.getCenter(), hypotenuse, this.getBearing() - Math.atan2(this.getWidth(), -this.getLength()) * 180 / Math.PI))
        latLngs.push(this.computeDestinationPoint(this.getCenter(), hypotenuse, this.getBearing() - Math.atan2(-this.getWidth(), -this.getLength()) * 180 / Math.PI))
        latLngs.push(this.computeDestinationPoint(this.getCenter(), hypotenuse, this.getBearing() - Math.atan2(-this.getWidth(), this.getLength()) * 180 / Math.PI))

        return [latLngs]
    },


    setLatLngs: function setLatLngs (latLngs) {
        this._setLatLngs(this.getLatLngs())
        return this.redraw()
    },

    getMaxMin: function getMaxMin (values) {
        return values.reduce(function (acc, val) {
            const newAcc = x_extends({}, acc)
            if (val < newAcc.min) newAcc.min = val
            if (val > newAcc.max) newAcc.max = val
            return newAcc
        }, { min: 0, max: 0 })
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
    },

    _update: function _update () {
        if (!this._map) {
            return
        }

        this._clipPoints()
        this._simplifyPoints()
        this._updatePath()
    },

    _updatePath: function _updatePath () {
        this._renderer._updatePoly(this, true)
    }
})

L.box = function (_ref2) {
    let _ref2$center = _ref2.center,
        center = _ref2$center === undefined ? [0, 0] : _ref2$center,
        _ref2$width = _ref2.width,
        width = _ref2$width === undefined ? 100 : _ref2$width,
        _ref2$length = _ref2.length,
        length = _ref2$length === undefined ? 100 : _ref2$length,
        _ref2$bearing = _ref2.bearing,
        bearing = _ref2$bearing === undefined ? 0 : _ref2$bearing,
        options = boxObjectWithoutProperties(_ref2, ['center', 'width', 'length', 'bearing'])
    return new L.Box(x_extends({ center, width, length, bearing }, options))
}
