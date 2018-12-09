var _extends = Object.assign || function (target) {
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

var objectWithoutProperties = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};

var RAD_TO_DEG = 180 / Math.PI,
    DEG_TO_RAD = Math.PI / 180;

var wrapBrg = function wrapBrg(brg) {
    if (brg < 0.0) {
        brg += 360.0;
        wrapBrg(brg);
    } else if (brg > 360.0) {
        brg -= 360.0;
        wrapBrg(brg);
    }
    return brg;
};

var atan2d = function atan2d(y, x) {
    return RAD_TO_DEG * Math.atan2(y, x);
};

var closeToZero = function closeToZero(x) {
    return Math.abs(x) < 0.0000000001 ? 0 : x;
};

L.Ellipse = L.Polygon.extend({
    options: {
        weight: 5,
        color: '#ffff00',
        stroke: true
    },

    initialize: function initialize(_ref) {
        var _ref$center = _ref.center,
            center = _ref$center === undefined ? [0, 0] : _ref$center,
            _ref$semiMinor = _ref.semiMinor,
            semiMinor = _ref$semiMinor === undefined ? 100 : _ref$semiMinor,
            _ref$semiMajor = _ref.semiMajor,
            semiMajor = _ref$semiMajor === undefined ? 200 : _ref$semiMajor,
            _ref$tilt = _ref.tilt,
            tilt = _ref$tilt === undefined ? 0 : _ref$tilt,
            options = objectWithoutProperties(_ref, ['center', 'semiMinor', 'semiMajor', 'tilt']);

        this.setOptions(options).setCenter(center).setSemiMinor(semiMinor).setSemiMajor(semiMajor).setTilt(tilt).setNumberOfPoints(61).setStartBearing(0).setEndBearing(360);
        this.setLatLngs();
    },
    setCenter: function setCenter() {
        var center = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { lat: 0, lng: 0 };

        if (center.lat) {
            this._center = L.latLng(center.lat, center.lng);
        } else {
            this._center = L.latLng(center[0], center[1]);
        }

        return this.redraw();
    },
    getCenter: function getCenter() {
        return this._center;
    },
    setSemiMinor: function setSemiMinor(val) {
        this._semiMinor = val;
        return this.redraw();
    },
    getSemiMinor: function getSemiMinor() {
        return this._semiMinor;
    },
    setSemiMajor: function setSemiMajor(val) {
        this._semiMajor = val;
        return this.redraw();
    },
    getSemiMajor: function getSemiMajor() {
        return this._semiMajor;
    },
    setTilt: function setTilt(tilt) {
        this._tiltDeg = tilt;
        return this.redraw();
    },
    getTilt: function getTilt() {
        return this._tiltDeg;
    },
    setStartBearing: function setStartBearing(brg) {
        var startBearing = brg || 0;
        /**
         * Not sure how much of these checks are neccessary
         * just using all as a temp fix for rotation problems.
         */
        var endBearing = this.getEndBearing() || 360;

        while (startBearing < 0) {
            startBearing += 360;
        }
        while (startBearing > 360) {
            startBearing -= 360;
        }

        if (endBearing < startBearing) {
            while (endBearing <= startBearing) {
                startBearing = startBearing - 360;
            }
        }

        this._startBearing = startBearing;
        return this.redraw();
    },
    getStartBearing: function getStartBearing() {
        return this._startBearing;
    },
    setEndBearing: function setEndBearing(brg) {
        var endBearing = brg || 90;

        /**
         * Not sure how much of these checks are neccessary
         * just using all as a temp fix for rotation problems.
         */
        var startBearing = this.getStartBearing() || 0;

        while (endBearing < 0) {
            endBearing += 360;
        }
        while (endBearing > 360) {
            endBearing -= 360;
        }

        if (startBearing > endBearing) {
            while (startBearing >= endBearing) {
                endBearing += 360;
            }
        }

        while (endBearing - startBearing > 360) {
            endBearing -= 360;
        }this._endBearing = endBearing;
        return this.redraw();
    },
    getEndBearing: function getEndBearing() {
        return this._endBearing;
    },
    getNumberOfPoints: function getNumberOfPoints() {
        return this._numberOfPoints;
    },
    setNumberOfPoints: function setNumberOfPoints() {
        var numberOfPoints = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 32;

        this._numberOfPoints = Math.max(10, numberOfPoints);
        return this.redraw();
    },
    getRhumb: function getRhumb() {
        return this._rhumb;
    },
    setRhumb: function setRhumb() {
        var rhumb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 45;

        this._rhumb = rhumb;
        return this.redraw();
    },
    getOptions: function getOptions() {
        return this.options;
    },
    setOptions: function setOptions(options) {
        var ops = options || {};
        L.setOptions(this, ops);
        return this.redraw();
    },
    getLatLngs: function getLatLngs() {
        var angle = void 0,
            x = void 0,
            y = void 0;
        var latlngs = [];
        var brg = wrapBrg(this.getTilt());
        var start = wrapBrg(this.getStartBearing());
        var diff = this.getEndBearing() - start;
        if (diff < 0) {
            diff += 360;
        }
        var delta = diff / (this._numberOfPoints - 1);

        if (this._semiMinor === this._semiMajor) {
            brg = 0;
        }

        var trueStart = wrapBrg(brg + start);
        //start = wrapBrg(450 - start)
        for (var i = 0; i < this._numberOfPoints; i++) {
            angle = start + i * delta;
            if (angle >= 360.0) {
                angle -= 360.0;
            }

            y = this._semiMinor * Math.sin(angle * DEG_TO_RAD);
            x = this._semiMajor * Math.cos(angle * DEG_TO_RAD);
            var tangle = closeToZero(this._semiMinor !== this._semiMajor ? atan2d(y, x) : i * delta);
            var dist = Math.sqrt(x * x + y * y);
            var pos = this.computeDestinationPos(this.getCenter(), dist, trueStart + tangle);
            //const tpos = this.getPos(this.getCenter(), angle, trueStart, this.getSemiMinor(), this.getSemiMajor())
            latlngs.push(pos);
        }

        return latlngs;
    },
    getPos: function getPos(center, angle, trueStart, semiMinor, semiMajor) {
        var y = semiMinor * Math.cos(angle * DEG_TO_RAD);
        var x = semiMajor * Math.sin(angle * DEG_TO_RAD);
        var tangle = closeToZero(semiMinor !== semiMajor ? atan2d(y, x) : -angle);

        var dist = Math.sqrt(x * x + y * y);
        return this.computeDestinationPos(center, dist, trueStart + tangle);
    },
    getLatRadius: function getLatRadius() {
        return this._semiMinor / 40075017 * 360;
    },
    getLngRadius: function getLngRadius() {
        return this._semiMajor / 40075017 * 360 / Math.cos(Math.PI / 180 * this._latlngs.lat);
    },
    setLatLngs: function setLatLngs() {
        var latlngs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.getLatLngs();

        this._setLatLngs(latlngs);
        return this.redraw();
    },


    setStyle: L.Path.prototype.setStyle,

    /*
    computeDestinationPos (
        start = { lat: 0, lng: 0 },
        distance = 1,
        bearing = 0,
        radius = 6378137,
        rhumb = this.getRhumb()
    ) {
        if (rhumb) {
            //http://www.movable-type.co.uk/scripts/latlong.html
             const δ = Number(distance) / radius // angular distance in radians
            const φ1 = start.lat * Math.PI / 180
            const λ1 = start.lng * Math.PI / 180
            const θ = bearing * Math.PI / 180
             const Δφ = δ * Math.cos(θ)
            let φ2 = φ1 + Δφ
             // check for some daft bugger going past the pole, normalise latitude if so
            if (Math.abs(φ2) > Math.PI / 2) φ2 = φ2 > 0 ? Math.PI - φ2 : -Math.PI - φ2
             const Δψ = Math.log(Math.tan(φ2 / 2 + Math.PI / 4) / Math.tan(φ1 / 2 + Math.PI / 4))
            const q = Math.abs(Δψ) > 10e-12 ? Δφ / Δψ : Math.cos(φ1) // E-W course becomes ill-conditioned with 0/0
             const Δλ = δ * Math.sin(θ) / q
            const λ2 = λ1 + Δλ
             //return new LatLon(φ2.toDegrees(), (λ2.toDegrees()+540) % 360 - 180); // normalise to −180..+180°
            return {
                lat: φ2 * 180 / Math.PI,
                lng: ((λ2 * 180 / Math.PI) + 540) % 360 - 180
            }
        }
        const bng = bearing * Math.PI / 180
         const lat1 = start.lat * Math.PI / 180
        const lon1 = start.lng * Math.PI / 180
         let lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / radius) +
            Math.cos(lat1) * Math.sin(distance / radius) * Math.cos(bng))
         let lon2 = lon1 + Math.atan2(Math.sin(bng) * Math.sin(distance / radius) * Math.cos(lat1),
            Math.cos(distance / radius) - Math.sin(lat1) * Math.sin(lat2))
         lat2 = lat2 * 180 / Math.PI
        lon2 = lon2 * 180 / Math.PI
         return {
            lat: lat2,
            lng: lon2
        }
     },
    */
    computeDestinationPos: function computeDestinationPos() {
        var start = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { lat: 0, lng: 0 };
        var distance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
        var bearing = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var rng = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 6378137;

        var bng = bearing * Math.PI / 180;

        var lat1 = start.lat * Math.PI / 180;
        var lon1 = start.lng * Math.PI / 180;

        var lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / rng) + Math.cos(lat1) * Math.sin(distance / rng) * Math.cos(bng));

        var lon2 = lon1 + Math.atan2(Math.sin(bng) * Math.sin(distance / rng) * Math.cos(lat1), Math.cos(distance / rng) - Math.sin(lat1) * Math.sin(lat2));

        lat2 = lat2 * 180 / Math.PI;
        lon2 = lon2 * 180 / Math.PI;

        return {
            lat: lat2,
            lng: lon2
        };
    }
});

L.ellipse = function (_ref2) {
    var _ref2$center = _ref2.center,
        center = _ref2$center === undefined ? [0, 0] : _ref2$center,
        _ref2$semiMinor = _ref2.semiMinor,
        semiMinor = _ref2$semiMinor === undefined ? 100 : _ref2$semiMinor,
        _ref2$semiMajor = _ref2.semiMajor,
        semiMajor = _ref2$semiMajor === undefined ? 200 : _ref2$semiMajor,
        _ref2$tilt = _ref2.tilt,
        tilt = _ref2$tilt === undefined ? 0 : _ref2$tilt,
        options = objectWithoutProperties(_ref2, ['center', 'semiMinor', 'semiMajor', 'tilt']);

    return new L.Ellipse(_extends({ center: center, semiMinor: semiMinor, semiMajor: semiMajor, tilt: tilt }, options));
};
