import { store } from './store'

const infoPane = document.querySelector('#infoPane')
const inputImageSizeElement = document.querySelector('#inputImageSize')
const outputImageSizeElement = document.querySelector('#outputImageSize')
const inputImageTypeElement = document.querySelector('#inputImageType')
const outputImageTypeElement = document.querySelector('#outputImageType')
const imageGainSizeElement = document.querySelector('#imageGainSize')

export const set = (key, value) => {
  store.set(key, value)
}

export const showInfoPane = ({
  inputImageSize,
  outputImageSize,
  inputImageType,
  outputImageType,
}) => {
  inputImageSize = inputImageSize || store.get('inputImageSize')
  outputImageSize = outputImageSize || store.get('outputImageSize')
  inputImageType = inputImageType || store.get('inputImageType')
  outputImageType = outputImageType || store.get('outputImageType')

  const percentageReduction =
    (parseInt(outputImageSize) / parseInt(inputImageSize)) * 100 - 100
  set('inputImageSize', inputImageSize)
  set('outputImageSize', outputImageSize)
  set('inputImageType', inputImageType)
  set('outputImageType', outputImageType)

  set('imageGainSize', Math.abs(percentageReduction.toFixed(2)) + '%')

  console.log(store.get('imageGainSize'))
  inputImageSizeElement.textContent = inputImageSize
  outputImageSizeElement.textContent = outputImageSize
  inputImageTypeElement.textContent = inputImageType
  outputImageTypeElement.textContent = outputImageType
  if (percentageReduction < 0) {
    imageGainSizeElement.textContent = '↓ ' + store.get('imageGainSize')
  } else {
    imageGainSizeElement.textContent = '↑ ' + store.get('imageGainSize')
  }

  infoPane.classList.remove('hidden')
}

export const hideInfoPane = () => {
  infoPane.classList.add('hidden')
}
