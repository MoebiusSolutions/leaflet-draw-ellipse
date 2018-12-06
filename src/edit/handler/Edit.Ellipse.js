L.Edit = L.Edit || {}

L.Edit.Ellipse = L.Edit.SimpleShape.extend({
    options: {
        moveIcon: new L.DivIcon({
            iconSize: new L.Point(7, 7),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move'
        }),
        resizeIcon: new L.DivIcon({
            iconSize: new L.Point(7, 7),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-resize'
        }),
        rotateIcon: new L.DivIcon({
            iconSize: new L.Point(7, 7),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-rotate'
        })
    },

    wrapBrg (brg) {
        if (brg < 0.0) {
            brg += 360.0
            this.wrapBrg(brg)
        }
        else if (brg > 360.0) {
            brg -= 360.0
            this.wrapBrg(brg)
        }
        return brg
    },

    atan2d (y, x) {
        const RAD_TO_DEG = 180 / Math.PI
        return RAD_TO_DEG * Math.atan2(y, x)
    },

    computeDestinationPoint () {
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

    getDistance (p, q) {
        return L.latLng(p).distanceTo(q)
    },

    getPos (center, angle, trueStart, semiMinor, semiMajor) {
        const DEG_TO_RAD = Math.PI / 180
        const y = semiMinor * Math.sin(angle * DEG_TO_RAD)
        const x = semiMajor * Math.cos(angle * DEG_TO_RAD)
        const dist = Math.sqrt(x * x + y * y)
        const tangle = (semiMinor !== semiMajor ? this.atan2d(y, x) : angle)
        return (this.computeDestinationPoint(center, dist, trueStart + tangle))
    },

    getMarkerPos (deg) {
        const center = this._shape.getCenter()
        const trueStart = this.wrapBrg(this._shape.getTilt())
        const semiMinor = this._shape.getSemiMinor()
        const semiMajor = this._shape.getSemiMajor()
        return this.getPos(center, deg, trueStart, semiMinor, semiMajor)
    },

    _initMarkers () {
        if (!this._markerGroup) {
            this._markerGroup = new L.LayerGroup()
        }

        // Create center marker
        this._createMoveMarker()

        // Create edge marker
        this._createResizeMarker()

        // Create rotate Marker();
        this._createRotateMarker()
    },

    _createMoveMarker () {
        const center = this._shape.getCenter()
        this._moveMarker = this._createMarker(center, this.options.moveIcon)
    },

    _createResizeMarker () {
        this._resizeMarkers = []
        this._resizeMarkers.push(this._createMarker(this.getMarkerPos(0), this.options.resizeIcon))
        this._resizeMarkers.push(this._createMarker(this.getMarkerPos(180), this.options.resizeIcon))
        this._resizeMarkers.push(this._createMarker(this.getMarkerPos(90), this.options.resizeIcon))
        this._resizeMarkers.push(this._createMarker(this.getMarkerPos(270), this.options.resizeIcon))
        this._resizeMarkers[0]._isX = true
        this._resizeMarkers[1]._isX = true
        this._resizeMarkers[2]._isY = true
        this._resizeMarkers[3]._isY = true
    },

    _createRotateMarker () {
        const pos = this.getRotateMarkerPos()
        this._rotateMarker = this._createMarker(pos, this.options.rotateIcon)
    },

    getRotateMarkerPos () {
        const pos = this.getMarkerPos(0)
        const p = this._map.project(pos)
        const c = this._map.project(this._shape.getCenter())
        const dX = (p.x >= c.x ? 20 : -20)
        const dY = (p.y <= c.y ? -20 : 20)
        return this._map.unproject([p.x + dX, p.y + dY])
    },

    _onMarkerDragStart (e) {
        L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this, e)
        this._currentMarker = e.target
    },

    _onMarkerDrag (e) {
        const marker = e.target,
            latlng = marker.getLatLng()

        if (marker === this._moveMarker) {
            this._move(latlng)
        } else if (marker === this._rotateMarker) {
            this._rotate(latlng)
        } else {
            this._resize(latlng)
        }
        this._shape.redraw()
    },

    _move (latlng) {
        // Move the ellipse
        this._shape.setCenter(latlng)
        this._shape.setLatLngs()

        // Move the resize marker
        this._repositionResizeMarkers()

        // Move the rotate marker
        this._repositionRotateMarker()
    },

    _computeBearing (fixedLatlng, latlng) {
        const RAD_TO_DEG = 180 / Math.PI
        const pc = this._map.project(fixedLatlng)
        const ph = this._map.project(latlng)
        const v = [ph.x - pc.x, ph.y - pc.y]
        const bearing = (Math.atan2(v[0], -v[1]) * RAD_TO_DEG) % 360
        return bearing || this._bearing
    },

    _rotate (latlng) {
        const fixedLatLng = this._moveMarker.getLatLng()
        const bearing = this._computeBearing(fixedLatLng, latlng)
        this._shape.setTilt(bearing)
        this._shape.setLatLngs()
        // Move the resize marker
        this._repositionResizeMarkers()

        // Move the rotate marker
        this._repositionRotateMarker()
    },

    _resize (latlng) {
        //const moveLatLng = this._moveMarker.getLatLng()
        //const radius = moveLatLng.distanceTo(latlng)
        if (this._currentMarker._isX) {
            this._shape.setSemiMajor(this.getDistance(this._shape.getCenter(), latlng))
        } else {
            this._shape.setSemiMinor(this.getDistance(this._shape.getCenter(), latlng))
        }
        this._shape.setLatLngs()
        // Move the resize marker
        this._repositionResizeMarkers()
        // Move the rotate marker
        this._repositionRotateMarker()
    },

    _repositionResizeMarkers () {
        this._resizeMarkers[0].setLatLng(this.getMarkerPos(0))
        this._resizeMarkers[1].setLatLng(this.getMarkerPos(180))
        this._resizeMarkers[2].setLatLng(this.getMarkerPos(90))
        this._resizeMarkers[3].setLatLng(this.getMarkerPos(270))
    },

    _repositionRotateMarker () {
        this._rotateMarker.setLatLng(this.getRotateMarkerPos())
    }
})

L.Ellipse.addInitHook(function () {
    if (L.Edit.Ellipse) {
        this.editing = new L.Edit.Ellipse(this)

        if (this.options.editable) {
            this.editing.enable()
        }
    }

    this.on('add', function () {
        if (this.editing && this.editing.enabled()) {
            this.editing.addHooks()
        }
    })

    this.on('remove', function () {
        if (this.editing && this.editing.enabled()) {
            this.editing.removeHooks()
        }
    })
})