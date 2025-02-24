// utils.js
const Utils = {
    clamp: (value, min, max) => {
        return Math.min(Math.max(value, min), max);
    },

    lerp: (start, end, t) => {
        return start + (end - start) * t;
    },

    randomRange: (min, max) => {
        return Math.random() * (max - min) + min;
    }
};