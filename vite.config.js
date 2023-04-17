import crossOriginIsolation from 'vite-plugin-cross-origin-isolation'
import eslint from 'vite-plugin-eslint'
export default {
  plugins: [eslint(), crossOriginIsolation()],
}
