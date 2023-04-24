import './css/styles.css'
import { sendImageFile } from './script'
import { store } from './store'
import {
  display,
  get_cursor_position_relative_to_element,
  get_percentage_from_x,
  updateSeparator,
} from './utils'

const separator = document.querySelector('#quality_separator')
const parent = document.querySelector('#imagebox')
const fileBrowser = document.querySelector('#fileBrowser')
const fileSelect = document.querySelector('#fileselect')
const rangeQualityInput = document.querySelector('#qualityRange')
const uploadButton = document.querySelector('#uploadBtn')
const downloadLink = document.querySelector('#downloadLink')
const dragFeedback = document.querySelector('#dragFeedback')

let isEventAttached = false

uploadButton.addEventListener('touchstart', (e) => {
  e.preventDefault()
  uploadButton.click()
})
downloadLink.addEventListener('touchstart', (e) => {
  e.preventDefault()
  downloadLink.click()
})
uploadButton.addEventListener('click', (e) => {
  e.preventDefault()

  fileSelect.click()
})

const moveListener = (isTouch, event) => {
  if (!isEventAttached) return

  event.preventDefault()

  if (isTouch) event = event.touches[0]
  const [x, _] = get_cursor_position_relative_to_element(parent, event)
  const percentage = get_percentage_from_x(x, parent)

  document.documentElement.style.setProperty(
    '--split-point-percentage',
    `${percentage}%`
  )
  document.documentElement.style.setProperty('--split-point', `${x}px`)
}

separator.addEventListener('mousedown', (event) => {
  event.preventDefault()

  if (isEventAttached) return
  separator.classList.add('dragging')
  parent.addEventListener('mousemove', moveListener.bind(null, false))
  isEventAttached = true
})

separator.addEventListener('touchstart', (event) => {
  event.preventDefault()

  if (isEventAttached) return
  separator.classList.add('dragging')
  parent.addEventListener('touchmove', moveListener.bind(null, true))
  isEventAttached = true
})

parent.addEventListener('touchend', (event) => {
  event.preventDefault()
  isEventAttached = false
  separator.classList.remove('dragging')
  parent.removeEventListener('touchmove', moveListener)
})

parent.addEventListener('mouseup', (event) => {
  event.preventDefault()
  isEventAttached = false
  separator.classList.remove('dragging')
  parent.removeEventListener('mousemove', moveListener)
})

window.addEventListener('resize', () => {
  updateSeparator()
  const mediaQuery = window.matchMedia('(max-width: 991px)')
  if (mediaQuery.matches) {
    rangeQualityInput.removeAttribute('orient')
  } else {
    rangeQualityInput.setAttribute('orient', 'vertical')
  }
})

fileBrowser.addEventListener('click', (e) => {
  if (e.target === fileSelect) return
  e.preventDefault()
  fileSelect.click()
})

rangeQualityInput.addEventListener('input', (e) => {
  const loaded = store.get('highQualityLoaded')

  if (loaded) display(e.target.value)
  else {
    const wrapper = document.querySelector('#wrapper')
    wrapper.classList.add('hidden')
    const loadingContainer = document.querySelector('#loading_container')
    loadingContainer.classList.remove('hidden')
    store.set('displayedImageId', e.target.value)
  }
})

const mediaQuery = window.matchMedia('(max-width: 991px)')
if (mediaQuery.matches) {
  rangeQualityInput.removeAttribute('orient')
} else {
  rangeQualityInput.setAttribute('orient', 'vertical')
}

document.addEventListener('dragenter', (e) => {
  if (store.get('highQualityLoading')) return
  e.dataTransfer.dropEffect = 'copyMove'
  if (e.currentTarget.contains(e.relatedTarget)) return
  e.preventDefault()
  dragFeedback.classList.remove('hidden')
})

document.addEventListener('dragleave', (e) => {
  if (store.get('highQualityLoading')) return
  e.preventDefault()
  if (e.currentTarget.contains(e.relatedTarget)) return

  dragFeedback.classList.add('hidden')
})

document.addEventListener('drop', (e) => {
  if (store.get('highQualityLoading')) return
  e.preventDefault()
  dragFeedback.classList.add('hidden')
  const file = e.dataTransfer.items[0].getAsFile()
  sendImageFile(file)
})

document.addEventListener('dragover', (e) => {
  if (store.get('highQualityLoading')) return
  e.preventDefault()
})
