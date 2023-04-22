export function display_compressed_image(
  height,
  width,
  imageData,
  outputImage
) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = width
  canvas.height = height

  context.putImageData(imageData, 0, 0)

  const src = canvas.toDataURL('image/webp')
  outputImage.src = src

  let base64Length = src.length - (src.indexOf(',') + 1)
  let padding =
    src.charAt(src.length - 2) === '='
      ? 2
      : src.charAt(src.length - 1) === '='
      ? 1
      : 0
  let fileSize = base64Length * 0.75 - padding
  console.log(`Expected size: ${Math.round(fileSize / 1000, 2)} KB`)
}

export function display_separator() {
  const separator = document.querySelector('#quality_separator')
  separator.classList.add('visible')

  const input_canvas = document.querySelector('#input_canvas')
  const img_width = input_canvas.getBoundingClientRect().width

  document.documentElement.style.setProperty(
    '--split-point',
    `${img_width / 2}px`
  )
}

export function get_cursor_position_relative_to_element(element, event) {
  const rect = element.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const elementWidth = rect.right - rect.left
  return [clamp(x, 0, elementWidth), y]
}

export function get_percentage_from_x(x, element) {
  const rect = element.getBoundingClientRect()
  const width = rect.width
  return 100 - (x / width) * 100
}

export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max)
}
