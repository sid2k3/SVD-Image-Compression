import { store } from './store'

const outputImage = document.querySelector('#compressed_image')

//to display images when all images are computed and data urls are set
export function display(image_id) {
  store.set('displayedImageId', image_id)
  display_compressed_image(image_id, outputImage, 'highQuality')
}
export function create_data_urls(
  height,
  width,
  bufferArray,
  imageData,
  numberOfRanks,
  mode
) {
  const image_size = height * width * 4
  const data_urls = []
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = width
  canvas.height = height

  if (mode === 'preview') {
    imageData.data.set(bufferArray.subarray(0, image_size))
    context.putImageData(imageData, 0, 0)

    const src = canvas.toDataURL('image/webp')

    store.set('previewURL', src)

    return src
  }
  for (let i = 0; i < numberOfRanks; i++) {
    // set underlying data of imageData object of canvas to subarray of bufferArray which contains the (i+1)th compressed image
    imageData.data.set(
      bufferArray.subarray(image_size * i, image_size * (i + 1))
    )

    context.putImageData(imageData, 0, 0)

    const src = canvas.toDataURL('image/webp')
    data_urls.push(src)
  }
  store.set('data_urls', data_urls)
}

export function display_compressed_image(image_id, outputImage, mode) {
  const src =
    mode === 'preview'
      ? store.get('previewURL')
      : store.get('data_urls')[image_id]

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
  const separator_svg = document.querySelector('#quality_separator_icon')
  separator_svg.style.removeProperty('visibility')
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

export function updateSeparator() {
  const percentage =
    document.documentElement.style.getPropertyValue(
      '--split-point-percentage'
    ) || '50%'

  const canvas = document.querySelector('#input_canvas')
  const width = canvas.getBoundingClientRect().width
  const x = width - (percentage.replace('%', '') / 100) * width

  document.documentElement.style.setProperty('--split-point', `${x}px`)
}
