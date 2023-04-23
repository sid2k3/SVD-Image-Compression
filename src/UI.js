import './css/styles.css'
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

let isEventAttached = false

const moveListener = (event) => {
  if (!isEventAttached) return

  event.preventDefault()

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
  parent.addEventListener('mousemove', moveListener)
  isEventAttached = true
})

parent.addEventListener('mouseup', (event) => {
  event.preventDefault()
  isEventAttached = false
  separator.classList.remove('dragging')
  parent.removeEventListener('mousemove', moveListener)
})

window.addEventListener('resize', () => {
  updateSeparator()
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
  }
})
