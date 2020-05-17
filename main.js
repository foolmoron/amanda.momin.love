// util
function debounce(func, time, context) {
    var timeoutId
    return function() {
        clearTimeout(timeoutId)
        const args = arguments
        timeoutId = setTimeout(function() { func.apply(context, args) }, time)
    }
}
function doEachAnimationFrame(func, context) {
    const wrappedFunc = () => {
        func.call(context)
        requestAnimationFrame(wrappedFunc)
    }
    requestAnimationFrame(wrappedFunc)
}
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
canvas.wrapperEl.classList.add('wave-border')
canvas.wrapperEl.style.setProperty('--wave-border-x', 3 + 'px')
canvas.wrapperEl.style.setProperty('--wave-border-y', 104 + 'px')

// resizing
let prevCanvasWidth = 0
let prevCanvasHeight = 0
doEachAnimationFrame(() => {
    if (canvas.wrapperEl.clientWidth != prevCanvasWidth || canvas.wrapperEl.clientHeight != prevCanvasHeight) {
        canvas.setWidth(canvas.wrapperEl.clientWidth)
        canvas.setHeight(canvas.wrapperEl.clientHeight)
        canvas.renderAll()
        prevCanvasWidth = canvas.wrapperEl.clientWidth
        prevCanvasHeight = canvas.wrapperEl.clientHeight
    }
})

// name
const nameInput = document.querySelector('input[name="full-name"]')
nameInput.value = localStorage.getItem('DRAW-name') || ''
nameInput.addEventListener('input', (e) => localStorage.setItem('DRAW-name', nameInput.value.toString()))

// color controls
function setColor(colorPicker, colorButtons) {
    var currentIndex = colorButtons.indexOf(colorPicker)
    localStorage.setItem('DRAW-colorIndex', currentIndex)
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