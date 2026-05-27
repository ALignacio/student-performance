/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
// Styles
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'studentLab',
    themes: {
      studentLab: {
        dark: false,
        colors: {
          background: '#f4efe7',
          surface: '#fffaf3',
          primary: '#c36b3f',
          secondary: '#316b66',
          accent: '#7f6a55',
          error: '#ba1a1a',
          info: '#4466aa',
          success: '#2c905a',
          warning: '#c87026',
        },
      },
    },
  },
})
