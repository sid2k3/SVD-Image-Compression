import './css/styles.css'
import {
  get_cursor_position_relative_to_element,
  get_percentage_from_x,
} from './utils'

const separator = document.querySelector('#quality_separator')
const parent = document.querySelector('#imagebox')

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
  document.addEventListener('mousemove', moveListener)
  isEventAttached = true
})

document.addEventListener('mouseup', (event) => {
  event.preventDefault()
  isEventAttached = false
  document.removeEventListener('mousemove', moveListener)
})
