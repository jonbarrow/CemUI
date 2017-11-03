"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/*! Controller.js - v1.0.2 - 2017-05-17 */
function Controller(HTMLgamepad) {
    "use strict";

    if (HTMLgamepad.constructor.name !== "Gamepad") {
        return false;
    }
    var id = HTMLgamepad.id;
    var index = HTMLgamepad.index;
    var timestamp = Date.now();
    var RAF = null;
    var lastUpdated = 0;
    var analogMap = {};
    var eventQueue = {};
    var layoutInfo = {};
    var connected = true;
    var state = {};
    var unknownLayout = true;
    var settings = arguments[1] || false;
    var gamepad = HTMLgamepad;
    var _disconnectController = disconnectController.bind(this);
    function updateController() {
        if (!connected) {
            window.cancelAnimationFrame(RAF);
            RAF = null;
            return;
        }
        checkInputs.call(this);
        RAF = window.requestAnimationFrame(updateController.bind(this));
    }
    function checkInputs() {
        gamepad = this.constructor.gamepads[index];
        lastUpdated = performance.now();
        loopThroughButtons.call(this);
        if ("LEFT_ANALOG_STICK_HOR" in analogMap && "LEFT_ANALOG_STICK_VERT" in analogMap) {
            processAnalogStick.call(this, "LEFT_ANALOG_STICK", {
                x: getNormalizedAnalogInput(gamepad.axes[analogMap.LEFT_ANALOG_STICK_HOR]),
                y: getNormalizedAnalogInput(gamepad.axes[analogMap.LEFT_ANALOG_STICK_VERT])
            });
        }
        if ("RIGHT_ANALOG_STICK_HOR" in analogMap && "RIGHT_ANALOG_STICK_VERT" in analogMap) {
            processAnalogStick.call(this, "RIGHT_ANALOG_STICK", {
                x: getNormalizedAnalogInput(gamepad.axes[analogMap.RIGHT_ANALOG_STICK_HOR]),
                y: getNormalizedAnalogInput(gamepad.axes[analogMap.RIGHT_ANALOG_STICK_VERT])
            });
        }
        switch (this.settings.useAnalogAsDpad) {
            case "left":
                processAnalogAsDpad.call(this, "left");
                break;

            case "right":
                processAnalogAsDpad.call(this, "right");
                break;

            case "both":
                processAnalogAsDpad.call(this, "left");
                processAnalogAsDpad.call(this, "right");
                break;
        }
        for (var input in eventQueue) {
            var event = eventQueue[input];
            dispatchCustomEvent(event.name, event.detail, event.info);
            delete eventQueue[input];
        }
    }
    function setupController() {
        this.settings = new GC_Settings();
        if (settings) {
            initSettings.call(this);
        }
        var layout = initControllerMapping.call(this);
        initPreviousInputs.call(this, layout);
        if (layout.init && typeof layout.init === "function") {
            layout.init(gamepad);
        }
        if (this.constructor.controllerCount === 0) {
            window.addEventListener("gamepaddisconnected", _disconnectController, false);
        }
        updateController.call(this);
    }
    function initControllerMapping() {
        var layout = {};
        if (this.constructor.layouts.has(this.name)) {
            unknownLayout = false;
            layout = this.constructor.layouts.get(this.name);
        } else if (gamepad.mapping === "standard") {
            unknownLayout = false;
            layout = this.constructor.layouts.get("standard");
        } else {
            console.warn(GC_Errors.MAP);
            layout = this.constructor.layouts.get("_unknown");
        }
        setLayoutInfo(layout);
        if (unknownLayout) {
            return layout;
        }
        var browser = getBrowser();
        if (browser && browser in layout) {
            layout = layout[browser];
        }
        for (var name in layout.axes) {
            switch (name) {
                case "LEFT_ANALOG_STICK_HOR":
                case "LEFT_ANALOG_STICK_VERT":
                case "RIGHT_ANALOG_STICK_HOR":
                case "RIGHT_ANALOG_STICK_VERT":
                    analogMap[name] = layout.axes[name];
                    break;
            }
        }
        layout.misc = {
            L_DPAD_UP: 0,
            L_DPAD_DOWN: 1,
            L_DPAD_LEFT: 2,
            L_DPAD_RIGHT: 3,
            R_DPAD_UP: 4,
            R_DPAD_DOWN: 5,
            R_DPAD_LEFT: 6,
            R_DPAD_RIGHT: 7
        };
        return layout;
    }
    function initPreviousInputs(layout) {
        var buttonNames = [];
        var axisNames = [];
        lastUpdated = performance.now();
        state.buttons = {};
        state.axes = {};
        state.misc = {};
        for (var group in state) {
            var map = layout[group];
            for (var name in map) {
                var inputIndex = map[name].index || map[name];
                var type = map[name].type || group;
                var data = map[name].data || undefined;
                var options = {};
                if (_typeof(map[name]) === "object") {
                    options = {
                        inputMin: map[name].inputMin || undefined,
                        inputMax: map[name].inputMax || undefined,
                        method: map[name].method || undefined,
                        ignoreConversion: map[name].ignoreConversion || undefined
                    };
                }
                if (type === "axes") {
                    if (name.endsWith("_HOR")) {
                        name = name.slice(0, -4);
                    } else if (name.endsWith("_VERT")) {
                        name = name.slice(0, -5);
                    }
                    state[type][name] = new AnalogStick(name, {
                        map: [group, inputIndex],
                        settings: this.settings,
                        options: options,
                        data: data
                    });
                    axisNames.push(inputIndex);
                } else if (type === "buttons") {
                    if (gamepad.buttons[inputIndex]) {
                        state[type][name] = new Button(name, {
                            map: [group, inputIndex],
                            settings: this.settings,
                            options: options,
                            data: data
                        });
                    }
                    buttonNames.push(inputIndex);
                } else if (type === "misc") {
                    state[type][name] = new Button(name, {
                        map: [group, inputIndex],
                        settings: this.settings,
                        options: options,
                        data: data
                    });
                }
            }
        }
        if (layout.options && layout.options.allowsExtras) {
            setupExtraButtons.call(this, buttonNames, "buttons");
            setupExtraButtons.call(this, axisNames, "axes");
        }
    }
    function initSettings() {
        this.settings.update(settings);
    }
    function disconnectController(event) {
        if (event.gamepad.index === this.index) {
            connected = false;
            this.unwatch.call(this);
            delete this.constructor.controllers[this.index];
            if (this.constructor.controllerCount === 0) {
                window.removeEventListener("gamepaddisconnected", _disconnectController);
            }
            dispatchCustomEvent(this.constructor.events.getName("controller", "disconnect"), {
                index: this.index,
                timestamp: Date.now()
            }, "Controller at index " + this.index + " disconnected.");
        }
    }
    function setupExtraButtons(list, type) {
        var prefix = type === "buttons" ? "BUTTON" : "AXIS";
        var i = 0;
        for (var _index in gamepad[type]) {
            if (list.indexOf(parseInt(_index)) === -1) {
                i++;
                var name = "MISC" + prefix + "_" + i;
                state.buttons[name] = new Button(name, {
                    map: [type, _index],
                    settings: this.settings
                });
            }
        }
    }
    function setLayoutInfo(layout) {
        layoutInfo.name = layout.name || undefined;
        layoutInfo.description = layout.description || undefined;
        layoutInfo.unknownLayout = unknownLayout || undefined;
        for (var _index2 in layoutInfo) {
            if (layoutInfo[_index2] === undefined) delete layoutInfo[_index2];
        }
    }
    function loopThroughButtons() {
        var inputs = state.buttons;
        for (var name in inputs) {
            var _index3 = inputs[name].getGamepadIndex();
            var section = inputs[name].getGamepadSection();
            var value = _typeof(gamepad[section][_index3]) === "object" ? gamepad[section][_index3].value : gamepad[section][_index3];
            processButton.call(this, name, value);
        }
    }
    function processButton(name, value) {
        if (value === undefined) {
            return;
        }
        var inputName = name.startsWith("L_") || name.startsWith("R_") ? name.substring(2) : name;
        var button = state.buttons[name] || state.axes[name] || state.misc[name];
        if (eventQueue[inputName] && eventQueue[inputName].name === this.constructor.events.getName("button", "during")) {
            return;
        }
        if (typeof button.getOption("method") === "function") {
            value = button.getOption("method").call(this, this.constructor.gamepads[this.index], button);
        }
        if (value !== button.value) {
            button.hasUpdated = true;
        }
        if (!button.getOption("ignoreConversion") && button.hasUpdated) {
            var min = button.getOption("inputMin") || 0;
            var max = button.getOption("inputMax") || 1;
            value = getLinearConversion(value, min, max, 0, 1);
        }
        var pressed = value > 0;
        var previouslyPressed = button.value > 0;
        if (!pressed && !previouslyPressed) {
            return;
        }
        button.update(value);
        var copy = button.copy();
        copy.name = inputName;
        if (pressed && !previouslyPressed) {
            queueEvent(inputName, this.constructor.events.getName("button", "start"), copy);
        } else if (pressed && previouslyPressed) {
            queueEvent(inputName, this.constructor.events.getName("button", "during"), copy);
        } else if (!pressed && previouslyPressed) {
            queueEvent(inputName, this.constructor.events.getName("button", "end"), copy);
        }
    }
    function processAnalogStick(name, input) {
        if (input.x === undefined || input.y === undefined) {
            return;
        }
        if (eventQueue[name] && eventQueue[name].name === this.constructor.events.getName("analog", "during")) {
            return;
        }
        var analogStick = state.axes[name] || state.buttons[name] || state.misc[name];
        var values = calculateAnalogValues.call(this, input);
        var pressed = isAnalogStickPressed(values);
        var previouslyPressed = isAnalogStickPressed(analogStick.position);
        var previousValues = {
            x: analogStick.position.x,
            y: analogStick.position.y
        };
        if (!pressed && !previouslyPressed) {
            return;
        }
        analogStick.update(values);
        var changed = analogStick.position.x !== previousValues.x || analogStick.position.y !== previousValues.y;
        var copy = analogStick.copy();
        if (pressed && !previouslyPressed) {
            queueEvent(name + "start", this.constructor.events.getName("analog", "start"), copy);
        } else if (pressed && previouslyPressed) {
            queueEvent(name + "during", this.constructor.events.getName("analog", "during"), copy);
        } else if (!pressed && previouslyPressed) {
            queueEvent(name + "end", this.constructor.events.getName("analog", "end"), copy);
        }
        if (changed) {
            queueEvent(name + "change", this.constructor.events.getName("analog", "change"), copy);
        }
    }
    function processAnalogAsDpad(stick) {
        var prefix = stick === "left" ? "L_" : "R_";
        var analogStick = stick === "left" ? "LEFT_ANALOG_STICK" : "RIGHT_ANALOG_STICK";
        var names = ["DPAD_UP", "DPAD_DOWN", "DPAD_LEFT", "DPAD_RIGHT"];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = names[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var name = _step.value;

                var inputAxis = 0;
                var otherAxis = 0;
                var isPastThreshold = false;
                switch (name) {
                    case "DPAD_UP":
                        inputAxis = state.axes[analogStick].position.y;
                        otherAxis = state.axes[analogStick].position.x;
                        isPastThreshold = inputAxis <= this.settings.analogStickDpadThreshold * -1;
                        break;

                    case "DPAD_DOWN":
                        inputAxis = state.axes[analogStick].position.y;
                        otherAxis = state.axes[analogStick].position.x;
                        isPastThreshold = inputAxis >= this.settings.analogStickDpadThreshold;
                        break;

                    case "DPAD_LEFT":
                        inputAxis = state.axes[analogStick].position.x;
                        otherAxis = state.axes[analogStick].position.y;
                        isPastThreshold = inputAxis <= this.settings.analogStickDpadThreshold * -1;
                        break;

                    case "DPAD_RIGHT":
                        inputAxis = state.axes[analogStick].position.x;
                        otherAxis = state.axes[analogStick].position.y;
                        isPastThreshold = inputAxis >= this.settings.analogStickDpadThreshold;
                        break;
                }
                var value = isPastThreshold && Math.abs(inputAxis) > Math.abs(otherAxis) ? 1 : 0;
                processButton.call(this, prefix + name, value);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }
    function calculateAnalogValues(values) {
        var output = {
            x: 0,
            y: 0
        };
        if (values.x !== 0) {
            output.x = getLinearConversion(Math.abs(values.x), this.settings.analogStickDeadzone.min, this.settings.analogStickDeadzone.max, 0, 1);
            if (values.x < 0 && output.x !== 0) {
                output.x *= -1;
            }
        }
        if (values.y !== 0) {
            output.y = getLinearConversion(Math.abs(values.y), this.settings.analogStickDeadzone.min, this.settings.analogStickDeadzone.max, 0, 1);
            if (values.y < 0 && output.y !== 0) {
                output.y *= -1;
            }
        }
        return this.settings.mapAnalogToShape === "square" ? getCoordsMappedToSquare(output) : output;
    }
    function dispatchCustomEvent(eventName, detail, info) {
        detail = detail || {};
        info = info || undefined;
        if (info) {
            console.info(info);
        }
        var event = new CustomEvent(eventName, {
            detail: detail,
            bubbles: true,
            cancelable: false
        });
        window.dispatchEvent(event);
    }
    function getCoordsMappedToSquare(coords) {
        if (coords.x === 0 || coords.y === 0) {
            return {
                x: coords.x,
                y: coords.y
            };
        } else {
            var abs = {
                x: Math.abs(coords.x),
                y: Math.abs(coords.y)
            };
            var oldLength = Math.hypot(abs.x, abs.y);
            var max = 1;
            if (abs.x > abs.y) {
                max = oldLength * (1 / abs.x);
            } else {
                max = oldLength * (1 / abs.y);
            }
            var newVals = getShortenedLineDistance(abs, getLinearConversion(oldLength, 0, 1, 0, max));
            return {
                x: coords.x > 0 ? newVals.x : -newVals.x,
                y: coords.y > 0 ? newVals.y : -newVals.y
            };
        }
    }
    function getLinearConversion(value, oldMin, oldMax, newMin, newMax) {
        var result = (value - oldMin) * (newMax - newMin) / (oldMax - oldMin) + newMin;
        if (newMax < newMin) {
            if (result < newMax) {
                result = newMax;
            } else if (result > newMin) {
                result = newMin;
            }
        } else {
            if (result > newMax) {
                result = newMax;
            } else if (result < newMin) {
                result = newMin;
            }
        }
        return result;
    }
    function getNormalizedAnalogInput(input) {
        if (Math.abs(input) < .1) {
            return 0;
        } else {
            return getLinearConversion(input, -.9, 1, -1, 1);
        }
    }
    function getShortenedLineDistance(values, distance) {
        var hypotenuse = Math.hypot(values.x, values.y);
        var angle = Math.acos(values.y / hypotenuse);
        return {
            x: Math.sin(angle) * distance,
            y: Math.cos(angle) * distance
        };
    }
    function isAnalogStickPressed(values) {
        return Math.abs(values.x) > 0 || Math.abs(values.y) > 0;
    }
    function queueEvent(input, eventName, detail, info) {
        eventQueue[input] = {
            name: eventName,
            detail: detail || {},
            info: info || undefined
        };
    }
    function getBrowser() {
        if ("chrome" in window) {
            return "Chrome";
        } else if ("opera" in window && {}.toString.call(window.opera) === "[object Opera]") {
            return "Opera";
        } else if ("MozAppearance" in document.documentElement.style) {
            return "Mozilla";
        } else if ("WebkitAppearance" in document.documentElement.style) {
            return "Webkit";
        } else {
            return undefined;
        }
    }
    this.watch = function () {
        if (!RAF) {
            updateController.call(this);
        }
    };
    this.unwatch = function () {
        if (RAF) {
            window.cancelAnimationFrame(RAF);
            RAF = undefined;
        }
    };
    Object.defineProperty(this, "index", {
        get: function get() {
            return index;
        }
    });
    Object.defineProperty(this, "id", {
        get: function get() {
            return id;
        }
    });
    Object.defineProperty(this, "name", {
        get: function get() {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = Controller.layouts.regex[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var regex = _step2.value;

                    if (regex.test(id)) {
                        return id.match(regex)[1].trim();
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
    });
    Object.defineProperty(this, "connectedTimestamp", {
        get: function get() {
            return timestamp;
        }
    });
    Object.defineProperty(this, "layoutInfo", {
        get: function get() {
            return layoutInfo;
        }
    });
    Object.defineProperty(this, "inputs", {
        get: function get() {
            var buttons = {};
            var analogSticks = {};
            for (var button in state.buttons) {
                buttons[button] = state.buttons[button].copy();
            }
            for (var axis in state.axes) {
                analogSticks[axis] = state.axes[axis].copy();
            }
            return {
                buttons: buttons,
                analogSticks: analogSticks
            };
        }
    });
    function Button(name, args) {
        args = args || {};
        var map = args.map || [];
        var options = args.options || {};
        var settings = args.settings || {};
        var data = args.data || undefined;
        var updated = false;
        this.controllerIndex = index;
        this.name = name;
        this.value = 0;
        setPressed.call(this);
        setTime.call(this);
        function setPressed() {
            this.pressed = this.value > (settings.buttonThreshold || 0);
        }
        function setTime() {
            this.time = lastUpdated;
        }
        this.getGamepadSection = function () {
            return map[0];
        };
        this.getGamepadIndex = function () {
            return map[1];
        };
        this.getOption = function (option) {
            return options[option];
        };
        this.update = function (value) {
            this.value = value;
            setPressed.call(this);
            setTime.call(this);
            if (!updated) {
                updated = true;
            }
        };
        this.copy = function () {
            var copy = {};
            for (var property in this) {
                if (typeof this[property] !== "function") {
                    copy[property] = this[property];
                }
            }
            return copy;
        };
        Object.defineProperty(this, "data", {
            get: function get() {
                return data;
            },
            set: function set(newData) {
                data = newData;
            }
        });
        Object.defineProperty(this, "hasUpdated", {
            get: function get() {
                return updated;
            },
            set: function set(hasUpdated) {
                updated = hasUpdated;
            }
        });
    }
    function AnalogStick(name, args) {
        args = args || {};
        var map = args.map || [];
        var options = args.options || {};
        var settings = args.settings || {};
        var data = args.data || undefined;
        var updated = false;
        this.controllerIndex = index;
        this.name = name;
        this.position = getPosition.call(this, {
            x: 0,
            y: 0
        });
        setAngle.call(this);
        setTime.call(this);
        function setAngle() {
            var radians = coordinatesToRadians(this.position.x, -this.position.y);
            var degrees = radiansToDegrees(radians);
            this.angle = {
                radians: getShortenedNumber(radians, 3),
                degrees: getShortenedNumber(degrees, 3)
            };
        }
        function setTime() {
            this.time = lastUpdated;
        }
        function getPosition(values) {
            return {
                x: roundPosition(values.x),
                y: roundPosition(values.y)
            };
        }
        function coordinatesToRadians(x, y) {
            if (x === 0 && y === 0) {
                return NaN;
            }
            var radians = Math.atan2(y, x);
            if (radians < 0) {
                radians += 2 * Math.PI;
            }
            return Math.abs(radians);
        }
        function roundPosition(number) {
            var result = 0;
            if (Math.abs(number) > 1) {
                result = Math.floor(number);
                if (result === -2) {
                    result = -1;
                }
            } else {
                result = Math.fround(number);
            }
            return result;
        }
        function getShortenedNumber(number, places) {
            var mult = Math.pow(10, places);
            return Math.round(number * mult) / mult;
        }
        function radiansToDegrees(radians) {
            if (isNaN(radians)) {
                return NaN;
            }
            return radians * (180 / Math.PI);
        }
        this.getGamepadSection = function () {
            return map[0];
        };
        this.getGamepadIndex = function () {
            return map[1];
        };
        this.getOption = function (option) {
            return options[option];
        };
        this.update = function (values) {
            this.position = getPosition.call(this, values);
            setAngle.call(this);
            setTime.call(this);
            if (!updated) {
                updated = true;
            }
        };
        this.copy = function () {
            var copy = {};
            for (var property in this) {
                if (typeof this[property] !== "function") {
                    copy[property] = this[property];
                }
            }
            return copy;
        };
        Object.defineProperty(this, "data", {
            get: function get() {
                return data;
            },
            set: function set(newData) {
                data = newData;
            }
        });
        Object.defineProperty(this, "hasUpdated", {
            get: function get() {
                return updated;
            },
            set: function set(hasUpdated) {
                updated = hasUpdated;
            }
        });
    }
    this._postSetup = function () {
        var data = {
            controller: this,
            id: id,
            index: index,
            timestamp: timestamp
        };
        if (unknownLayout) {
            data.unknownLayout = unknownLayout;
        }
        dispatchCustomEvent(this.constructor.events.getName("controller", "connect"), data, "Gamepad connected at index " + index + ".");
    };
    setupController.call(this);
}

Controller.search = function (options) {
    var timer = options && options.interval || 500;
    var limit = options && options.limit || undefined;
    if (!Controller.supported) {
        if (options && typeof options.unsupportedCallback === "function") {
            options.unsupportedCallback();
        }
        return false;
    }
    this.interval = setInterval(function () {
        if (limit !== undefined && this.controllerCount >= limit) {
            clearInterval(this.interval);
            return;
        }
        for (var index in this.gamepads) {
            index = parseInt(index, 10);
            if (isNaN(index)) {
                return;
            }
            if (this.gamepads[index] !== undefined && this.gamepads[index] !== null && this.getController(index) === undefined) {
                if (!this.controllers) {
                    this.controllers = {};
                }
                var settings = {};
                if (options && "settings" in options) {
                    settings = options.settings;
                }
                this.controllers[index] = new Controller(this.gamepads[index], settings);
                this.controllers[index]._postSetup.call(this.controllers[index]);
            }
        }
    }.bind(this), timer);
};

Controller.getController = function (index) {
    index = parseInt(index);
    if (typeof index !== "number" || isNaN(index)) {
        console.warn(index + " must be a number");
    } else if (index % 1 !== 0) {
        console.warn(index + " must be an int");
    } else if (index < 0) {
        console.warn(index + " must be positive");
    }
    return this.controllers && this.controllers[index];
};

Controller.watchAll = function () {
    for (var index in Controller.controllers) {
        Controller.getController(index).watch();
    }
};

Controller.unwatchAll = function () {
    for (var index in Controller.controllers) {
        Controller.getController(index).unwatch();
    }
};

Object.defineProperty(Controller, "controllerCount", {
    get: function get() {
        if (this.controllers) {
            return Object.keys(this.controllers).length;
        } else {
            return 0;
        }
    }
});

Object.defineProperty(Controller, "supported", {
    get: function get() {
        try {
            if (this.gamepads === null) {
                throw "GAMEPAD";
            } else if (!("defineProperty" in Object)) {
                throw "DEFINEPROPERTY";
            } else {
                return true;
            }
        } catch (error) {
            console.warn(GC_Errors[error]);
            return false;
        }
    }
});

Object.defineProperty(Controller, "gamepads", {
    get: function get() {
        var gamepads = null;
        if ("getGamepads" in navigator) {
            gamepads = navigator.getGamepads();
        } else if ("webkitGamepads" in navigator) {
            gamepads = navigator.webkitGamepads();
        } else if ("mozGamepads" in navigator) {
            gamepads = navigator.mozGamepads();
        } else if ("gamepads" in navigator) {
            gamepads = navigator.gamepads();
        }
        return gamepads;
    },
    enumerable: false
});

Math.hypot = Math.hypot || function () {
    var y = 0;
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = arguments[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var arg = _step3.value;

            if (arg === Infinity || arg === -Infinity) {
                return Infinity;
            }
            y += arg * arg;
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    return Math.sqrt(y);
};

Object.assign = Object.assign || function (target) {
    "use strict";

    if (target === null) {
        throw new TypeError("Cannot convert undefined or null to object");
    }
    target = Object(target);
    for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source !== null) {
            for (var key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
    }
    return target;
};

var GC_Errors = {
    get GAMEPAD() {
        return "This browser does not support the Gamepad API.";
    },
    get DEFINEPROPERTY() {
        return "This browser does not suppoert Object.defineProperty().";
    },
    get MAP() {
        return 'No matching map found. Using "Standard".';
    }
};

var GC_Events = function GC_Events() {
    var pre = "gc";
    this.getName = function (base, action) {
        var message = [pre, this[base.toUpperCase()].base, this[base.toUpperCase()].actions[action]];
        return message.join(".");
    };
};

Object.defineProperty(GC_Events.prototype, "CONTROLLER", {
    value: {
        base: "controller",
        actions: {
            connect: "found",
            disconnect: "lost"
        }
    }
});

Object.defineProperty(GC_Events.prototype, "BUTTON", {
    value: {
        base: "button",
        actions: {
            start: "press",
            during: "hold",
            end: "release"
        }
    }
});

Object.defineProperty(GC_Events.prototype, "ANALOG", {
    value: {
        base: "analog",
        actions: {
            start: "start",
            during: "hold",
            change: "change",
            end: "end"
        }
    }
});

Controller.events = new GC_Events();

var GC_Layouts = {
    list: {
        _unknown: {
            name: "Unknown Layout",
            description: "A fallback for when no appropriate layouts are found.",
            options: {
                allowsExtras: true
            }
        }
    },
    register: function register(map) {
        var layouts = Controller.layouts;
        var id = map.match;
        for (var i = 0; i < layouts.regex.length; i++) {
            var regex = this.regex[i];
            if (regex.test(id)) {
                id = id.match(regex)[1].trim();
                break;
            }
        }
        layouts.list[id.toLowerCase()] = map;
    },
    has: function has(name) {
        name = name.toLowerCase();
        return name in Controller.layouts.list;
    },
    get: function get(name) {
        name = name.toLowerCase();
        return Controller.layouts.list[name];
    },
    get regex() {
        return [/(.*)\(.*\)/, /[a-zA-Z0-9]{3,4}-[a-zA-Z0-9]{3,4}-(.*)/];
    }
};

Controller.layouts = GC_Layouts;

(function () {
    var standard = {
        match: "Standard",
        name: "Standard",
        description: "The W3C standard gamepad layout.",
        buttons: {
            FACE_1: 0,
            FACE_2: 1,
            FACE_3: 2,
            FACE_4: 3,
            LEFT_SHOULDER: 4,
            RIGHT_SHOULDER: 5,
            LEFT_SHOULDER_BOTTOM: 6,
            RIGHT_SHOULDER_BOTTOM: 7,
            SELECT: 8,
            START: 9,
            LEFT_ANALOG_BUTTON: 10,
            RIGHT_ANALOG_BUTTON: 11,
            DPAD_UP: 12,
            DPAD_DOWN: 13,
            DPAD_LEFT: 14,
            DPAD_RIGHT: 15,
            HOME: 16
        },
        axes: {
            LEFT_ANALOG_STICK_HOR: 0,
            LEFT_ANALOG_STICK_VERT: 1,
            RIGHT_ANALOG_STICK_HOR: 2,
            RIGHT_ANALOG_STICK_VERT: 3
        },
        options: {
            allowsExtras: true
        }
    };
    Controller.layouts.register(standard);
})();

var GC_Setting = function GC_Setting(name, defaultValue, setterFunction) {
    this.name = name;
    this.defaultValue = defaultValue;
    this.setterFunction = setterFunction;
};

var GC_Settings = function GC_Settings(isGlobalSettingList) {
    var globalSettings = isGlobalSettingList ? false : Controller.globalSettings;
    var localSettings = {};
    Object.defineProperty(this, "global", {
        value: !!isGlobalSettingList,
        writable: false,
        enumerable: false,
        configurable: false
    });
    this.register = function (setting) {
        if (!isGlobalSettingList) {
            console.warn("You can only register settings globally:\nController.globalSettings.register()");
            return false;
        }
        if (_typeof(setting.defaultValue) === "object") {
            setting.value = Object.assign({}, setting.defaultValue);
        } else {
            setting.value = setting.defaultValue;
        }
        Object.defineProperty(this.constructor.prototype, setting.name, {
            get: function get() {
                if (!this.global && setting.name in localSettings) {
                    return localSettings[setting.name];
                } else {
                    return setting.value;
                }
            },
            set: function set(value) {
                if (value === undefined || value === "default" && this.global) {
                    if (this.global) {
                        if (_typeof(setting.defaultValue) === "object") {
                            setting.value = Object.assign({}, setting.defaultValue);
                        } else {
                            setting.value = setting.defaultValue;
                        }
                    } else {
                        delete localSettings[setting.name];
                    }
                } else if (value === "default") {
                    if (_typeof(setting.defaultValue) === "object") {
                        localSettings[setting.name] = Object.assign({}, setting.defaultValue);
                    } else {
                        localSettings[setting.name] = setting.defaultValue;
                    }
                } else {
                    var newValue = setting.setterFunction(value);
                    if (newValue !== null) {
                        if (this.global) {
                            if ((typeof newValue === "undefined" ? "undefined" : _typeof(newValue)) === "object") {
                                Object.assign(setting.value, newValue);
                            } else {
                                setting.value = newValue;
                            }
                        } else {
                            if ((typeof newValue === "undefined" ? "undefined" : _typeof(newValue)) === "object") {
                                Object.assign(localSettings[setting.name], newValue);
                            } else {
                                localSettings[setting.name] = newValue;
                            }
                        }
                    }
                }
            },
            enumerable: true
        });
        return true;
    };
};

GC_Settings.prototype.list = function () {
    var output = {};
    for (var name in this.constructor.prototype) {
        if (this.constructor.prototype.hasOwnProperty(name) && typeof this.constructor.prototype[name] !== "function") {
            output[name] = this[name];
        }
    }
    return output;
};

GC_Settings.prototype.clear = function () {
    for (var name in this.constructor.prototype) {
        if (this.constructor.prototype.hasOwnProperty(name) && typeof this.constructor.prototype[name] !== "function") {
            this[name] = undefined;
        }
    }
    return true;
};

GC_Settings.prototype.update = function () {
    var success = false;
    switch (arguments.length) {
        case 1:
            if (_typeof(arguments[0]) === "object") {
                updateMultiple.call(this, arguments[0]);
            } else {
                console.warn('GC_Settings.update(settings) expects "settings" to be an object of key/value pairs.');
            }
            break;

        case 2:
            if (typeof arguments[0] === "string" && arguments[0] in this) {
                this[arguments[0]] = arguments[1];
            } else {
                console.warn('GC_Settings.update(settingName, value) expects "settingname" to be the name of a setting.');
            }
            break;

        default:
            console.warn('GC_Settings.update() expects either 1 or 2 arguments:\nupdate(settings) - where "settings" is an object key/value pairs\nupdate(settingName, value) - where "settingName" is the setting you want to change and "value" is what you want to change it to.');
            break;
    }
    function updateMultiple(list) {
        for (var name in list) {
            this[name] = list[name];
        }
    }
    return success;
};

Controller.globalSettings = new GC_Settings(true);

Controller.globalSettings.register(new GC_Setting("analogStickDeadzone", {
    min: 0,
    max: 1
}, function (value) {
    if ((typeof value === "undefined" ? "undefined" : _typeof(value)) !== "object" || !("min" in value || "max" in value)) {
        console.warn('Value must be an object containing either/both "min" and "max" values');
        return null;
    }
    var output = {};
    if ("min" in value && typeof value.min === "number" && value.min >= 0 && value.min <= 1) {
        output.min = value.min;
    }
    if ("max" in value && typeof value.max === "number" && value.max >= 0 && value.max <= 1) {
        output.max = value.max;
    }
    return output;
}));

Controller.globalSettings.register(new GC_Setting("analogStickDpadThreshold", .7, function (value) {
    if (typeof value === "number" && value >= 0 && value <= 1) {
        return value;
    } else {
        console.warn("angry");
        return null;
    }
}));

Controller.globalSettings.register(new GC_Setting("buttonThreshold", .95, function (value) {
    if (typeof value === "number" && value >= 0 && value <= 1) {
        return value;
    } else {
        console.warn("angry");
        return null;
    }
}));

Controller.globalSettings.register(new GC_Setting("mapAnalogToShape", "none", function (value) {
    if (value === "none") {
        return "none";
    } else if (value === "square") {
        return "square";
    } else {
        return null;
    }
}));

Controller.globalSettings.register(new GC_Setting("useAnalogAsDpad", "none", function (value) {
    var possible = ["none", "left", "right", "both", false];
    if (possible.indexOf(value) > -1) {
        return value;
    } else {
        console.warn('Not a valid option for "useAnalogAsDpad".');
        return null;
    }
}));
