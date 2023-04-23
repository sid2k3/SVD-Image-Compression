class Store {
  constructor() {
    window.dataStore = {
      previewLoading: false,
      previewLoaded: false,
      highQualityLoading: false,
      highQualityLoaded: false,
      inputImageType: '',
      outputImageType: 'WebP',
      inputImageSize: '',
      outputImageSize: '',
    }
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
      const loadingContainer = document.querySelector('#loading_container')
      loadingContainer.classList.add('hidden')
      const wrapper = document.querySelector('#wrapper')
      wrapper.classList.remove('hidden')
    }
    window.dataStore[key] = value
  }
  get(key) {
    return window.dataStore[key]
  }
}

export const store = new Store()
