import './css/styles.css'
import {
  get_cursor_position_relative_to_element,
  get_percentage_from_x,
  updateSeparator,
} from './utils'

const separator = document.querySelector('#quality_separator')
const parent = document.querySelector('#imagebox')
const fileBrowser = document.querySelector('#fileBrowser')
const fileSelect = document.querySelector('#fileselect')

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

document.addEventListener('mouseup', (event) => {
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
