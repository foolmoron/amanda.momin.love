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
        letter.style.transform = `translateX(${lerp(-1.5, 1.5, Math.random())}%) translateY(${lerp(-2.5, 2.5, Math.random())}%) rotate(${lerp(-9, 9, Math.random())}deg)`
        letter.style.setProperty('--color-angle', `${lerp(0, 360, Math.random())}deg`)
        letter.style.backgroundPosition = `${lerp(-100, 100, Math.random())}% ${lerp(-100, 100, Math.random())}%`
    })
}
document.querySelectorAll('.callout').forEach(callout => {
    const letters = callout.querySelectorAll('.title span')
    let intervalId = 0
    callout.addEventListener('mouseenter', e => {
        intervalId = setInterval(() => doLetters(letters), 450)
        doLetters(letters)
    })
    callout.addEventListener('mouseleave', e => {
        clearInterval(intervalId)
        letters.forEach(letter => letter.style.transform = ``)
    })
})

// callbacks
function submitFullName(name) {
    console.log('SUBMIT', name)
}

// main
var canvas = new fabric.Canvas('canvas', {
    isDrawingMode: true,
})

// color controls
function setColor(colorPicker, colorButtons) {
    var currentIndex = colorButtons.indexOf(colorPicker)
    localStorage.setItem('colorIndex', currentIndex)
    // unset old
    for (let button of colorButtons) {
        button.classList.remove('selected')
    }
    // set color
    colorPicker.classList.add('selected')
    var color = colorPicker.dataset.color
    canvas.freeDrawingBrush.color = color
    document.querySelector('.draw-panel').style.backgroundColor = color
}

function setupColors(initialColorIndex) {
    var colorButtons = Array.from(document.querySelectorAll('.colors > div'))
    for (let button of colorButtons) {
        button.style.backgroundColor = button.dataset.color
        button.onclick = function(e) { setColor(button, colorButtons) }
    }
    setColor(colorButtons[initialColorIndex || 8], colorButtons)
}
setupColors(parseInt(localStorage.getItem('colorIndex')))