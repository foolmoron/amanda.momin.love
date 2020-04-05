// util
function lerp(a, b, t) {
    return a + t * (b - a)
}
function ilerp(x, a, b) {
    return (x - a) / (b - a)
}

// callout banner color anim
function doLetters(letters) {
    letters.forEach(letter => {
        letter.style.transform = `translateX(${lerp(-1.5, 1.5, Math.random())}%) translateY(${lerp(-2.5, 2.5, Math.random())}%) rotate(${lerp(-9, 9, Math.random())}deg)`;
        letter.style.setProperty('--color-angle', `${lerp(0, 360, Math.random())}deg`);
        letter.style.backgroundPosition = `${lerp(-100, 100, Math.random())}% ${lerp(-100, 100, Math.random())}%`;
    });
};
document.querySelectorAll('.callout').forEach(callout => {
    const letters = callout.querySelectorAll('.title span');
    let intervalId = 0;
    callout.addEventListener('mouseenter', e => {
        intervalId = setInterval(() => doLetters(letters), 450);
        doLetters(letters);
    });
    callout.addEventListener('mouseleave', e => {
        clearInterval(intervalId);
        letters.forEach(letter => letter.style.transform = ``);
    });
});