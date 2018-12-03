L.Edit = L.Edit || {}

L.Edit.Ellipse = L.Edit.SimpleShape.extend({
    options: {
        moveIcon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move'
        }),
        resizeIcon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-resize'
        }),
        rotateIcon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-rotate'
        })
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
        const center = this._shape.getLatLng()

        this._moveMarker = this._createMarker(center, this.options.moveIcon)
    },

    _createResizeMarker () {
        const center = this._shape.getLatLng(),
            resizemarkerPointX1 = this._getResizeMarkerPointX1(center),
            resizemarkerPointX2 = this._getResizeMarkerPointX2(center),
            resizemarkerPointY1 = this._getResizeMarkerPointY1(center),
            resizemarkerPointY2 = this._getResizeMarkerPointY2(center)

        this._resizeMarkers = []
        this._resizeMarkers.push(this._createMarker(resizemarkerPointX1, this.options.resizeIcon))
        this._resizeMarkers.push(this._createMarker(resizemarkerPointX2, this.options.resizeIcon))
        this._resizeMarkers.push(this._createMarker(resizemarkerPointY1, this.options.resizeIcon))
        this._resizeMarkers.push(this._createMarker(resizemarkerPointY2, this.options.resizeIcon))
        this._resizeMarkers[0]._isX = true
        this._resizeMarkers[1]._isX = true
        this._resizeMarkers[2]._isX = false
        this._resizeMarkers[3]._isX = false
    },

    _createRotateMarker () {
        const center = this._shape.getLatLng(),
            rotatemarkerPoint = this._getRotateMarkerPoint(center)

        this._rotateMarker = this._createMarker(rotatemarkerPoint, this.options.rotateIcon)
    },

    _getResizeMarkerPointX1 (latlng) {
        const tilt = this._shape._tiltDeg * (Math.PI / 180)//L.LatLng.DEG_TO_RAD;
        const radius = this._shape._radiusX
        const xDelta = radius * Math.cos(tilt)
        const yDelta = radius * Math.sin(tilt)
        const point = this._map.project(latlng)
        return this._map.unproject([point.x + xDelta, point.y + yDelta])
    },

    _getResizeMarkerPointX2 (latlng) {
        const tilt = this._shape._tiltDeg * (Math.PI / 180)//L.LatLng.DEG_TO_RAD;
        const radius = this._shape._radiusX
        const xDelta = radius * Math.cos(tilt)
        const yDelta = radius * Math.sin(tilt)
        const point = this._map.project(latlng)
        return this._map.unproject([point.x - xDelta, point.y - yDelta])
    },

    _getResizeMarkerPointY1 (latlng) {
        const tilt = this._shape._tiltDeg * (Math.PI / 180)//L.LatLng.DEG_TO_RAD;
        const radius = this._shape._radiusY
        const xDelta = radius * Math.sin(tilt)
        const yDelta = radius * Math.cos(tilt)
        const point = this._map.project(latlng)
        return this._map.unproject([point.x - xDelta, point.y + yDelta])
    },

    _getResizeMarkerPointY2 (latlng) {
        const tilt = this._shape._tiltDeg * (Math.PI / 180)//L.LatLng.DEG_TO_RAD;
        const radius = this._shape._radiusY
        const xDelta = radius * Math.sin(tilt)
        const yDelta = radius * Math.cos(tilt)
        const point = this._map.project(latlng)
        return this._map.unproject([point.x + xDelta, point.y - yDelta])
    },

    _getRotateMarkerPoint (latlng) {
        const tilt = this._shape._tiltDeg * (Math.PI / 180)//L.LatLng.DEG_TO_RAD;
        const radius = this._shape._radiusX + 20
        const xDelta = radius * Math.cos(tilt)
        const yDelta = radius * Math.sin(tilt)
        const point = this._map.project(latlng)
        return this._map.unproject([point.x - xDelta, point.y - yDelta])
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
        this._shape.setLatLng(latlng)

        // Move the resize marker
        this._repositionResizeMarkers()

        // Move the rotate marker
        this._repositionRotateMarker()
    },

    _computeBearing (fixedLatlng, latlng) {
        const RAD_TO_DEG = 180 / Math.PI
        const pc = this._map.project(fixedLatlng)
        const ph = this._map.project(latlng)
        const v = [ph.x - pc.x, pc.y - ph.y]
        const bearing = (180 - Math.atan2(v[1], v[0]) * RAD_TO_DEG) % 360
        return bearing || this._bearing
    },

    _rotate (latlng) {
        const fixedLatLng = this._moveMarker.getLatLng()
        const bearing = this._computeBearing(fixedLatLng, latlng)
        this._shape.setTilt(bearing)
        // Move the resize marker
        this._repositionResizeMarkers()

        // Move the rotate marker
        this._repositionRotateMarker()
    },

    _resize (latlng) {
        const moveLatLng = this._moveMarker.getLatLng()
        const radius = moveLatLng.distanceTo(latlng)
        if (this._currentMarker._isX) {
            this._shape.setRadius([radius, this._shape._mRadiusY])
        } else {
            this._shape.setRadius([this._shape._mRadiusX, radius])
        }

        // Move the resize marker
        this._repositionResizeMarkers()
        // Move the rotate marker
        this._repositionRotateMarker()
    },

    _repositionResizeMarkers () {
        const latlng = this._moveMarker.getLatLng()
        const resizemarkerPointX1 = this._getResizeMarkerPointX1(latlng)
        const resizemarkerPointX2 = this._getResizeMarkerPointX2(latlng)
        const resizemarkerPointY1 = this._getResizeMarkerPointY1(latlng)
        const resizemarkerPointY2 = this._getResizeMarkerPointY2(latlng)

        this._resizeMarkers[0].setLatLng(resizemarkerPointX1)
        this._resizeMarkers[1].setLatLng(resizemarkerPointX2)
        this._resizeMarkers[2].setLatLng(resizemarkerPointY1)
        this._resizeMarkers[3].setLatLng(resizemarkerPointY2)
    },

    _repositionRotateMarker () {
        const latlng = this._moveMarker.getLatLng()
        const rotatemarkerPoint = this._getRotateMarkerPoint(latlng)

        this._rotateMarker.setLatLng(rotatemarkerPoint)
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