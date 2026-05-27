import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/pages/Dashboard.vue'
import Predict from '@/pages/Predict.vue'
import Results from '@/pages/Results.vue'
import Train from '@/pages/Train.vue'
import Upload from '@/pages/Upload.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
      meta: {
        title: 'Dashboard',
        icon: 'mdi-view-dashboard-outline',
      },
    },
    {
      path: '/upload',
      name: 'upload',
      component: Upload,
      meta: {
        title: 'Upload Dataset',
        icon: 'mdi-file-upload-outline',
      },
    },
    {
      path: '/train',
      name: 'train',
      component: Train,
      meta: {
        title: 'Train Models',
        icon: 'mdi-creation-outline',
      },
    },
    {
      path: '/results',
      name: 'results',
      component: Results,
      meta: {
        title: 'Results',
        icon: 'mdi-chart-line',
      },
    },
    {
      path: '/predict',
      name: 'predict',
      component: Predict,
      meta: {
        title: 'Predict',
        icon: 'mdi-crystal-ball',
      },
    },
  ],
})

export default router
