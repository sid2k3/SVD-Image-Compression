class Store {
  INITIAL_STATE = {
    previewLoading: false,
    previewLoaded: false,
    highQualityLoading: false,
    highQualityLoaded: false,
    inputImageType: '',
    outputImageType: 'webp',
    inputImageSize: '',
    outputImageSize: '',
    imageAlgorithmQualities: [0.4, 0.45, 0.6, 0.65, 0.7, 0.75],
    supportedFormats: ['webp', 'jpeg', 'png'],
  }

  constructor() {
    window.dataStore = { ...this.INITIAL_STATE }
  }

  set(key, value) {
    if (key === 'previewLoading' && !!value) {
      const loadingContainer = document.querySelector('#loading_container')
      loadingContainer.classList.remove('hidden')
      const fileBrowser = document.querySelector('#fileBrowser')
      fileBrowser.classList.add('hidden')
    } else if (key === 'previewLoading') {
      const loadingContainer = document.querySelector('#loading_container')
      loadingContainer.classList.add('hidden')
    } else if (key === 'highQualityLoaded' && !!value) {
      const infoPane = document.querySelector('#infoPane')
      infoPane.classList.remove('hidden')
      const loadingContainer = document.querySelector('#loading_container')
      loadingContainer.classList.add('hidden')
      const wrapper = document.querySelector('#wrapper')
      wrapper.classList.remove('hidden')
    } else if (key === 'highQualityLoaded' && !value) {
      const infoPane = document.querySelector('#infoPane')
      infoPane.classList.add('hidden')
      const loadingContainer = document.querySelector('#loading_container')
      loadingContainer.classList.remove('hidden')
      const wrapper = document.querySelector('#wrapper')
      wrapper.classList.add('hidden')
    }
    window.dataStore[key] = value
  }

  get(key) {
    return window.dataStore[key]
  }

  reset() {
    window.dataStore = { ...this.INITIAL_STATE, worker: this.get('worker') }
  }
}

export const store = new Store()
