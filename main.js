// util
function lerp(a, b, t) {
    return a + t * (b - a)
}
function ilerp(x, a, b) {
    return (x - a) / (b - a)
}

// callout banner color anim
document.querySelectorAll('.callout').forEach(callout => {
    callout.addEventListener('mouseenter', e => {
        callout.style.setProperty('--color-angle', lerp(15, 75, Math.random()) + 'deg');
    });
    callout.addEventListener('mouseleave', e => {
        callout.style.setProperty('--color-angle', -lerp(15, 75, Math.random()) + 'deg');
    });
});