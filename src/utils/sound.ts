import correctUrl from "../assets/sounds/woosh.ogg"
import correct2Url from "../assets/sounds/woosh_heightened.ogg"
import winUrl from "../assets/sounds/kaselmeyk_level-up.ogg"

const correct = new Audio(correctUrl)
const correct2 = new Audio(correct2Url)
const win = new Audio(winUrl)

correct.preload = "auto"
correct2.preload = "auto"
win.preload = "auto"

function play(audio: HTMLAudioElement) {
    audio.pause()
    audio.currentTime = 0
    audio.play().catch(() => {})
}

export function playCorrect() {
    play(correct)
}

export function playCorrect2() {
    play(correct2)
}

export function playWin() {
    play(win)
}