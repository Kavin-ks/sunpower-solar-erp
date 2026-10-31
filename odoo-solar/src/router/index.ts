import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import AboutView from '@/views/AboutView.vue';
import ServiceView from '@/views/ServiceView.vue';
import ServiceDetailsView from '@/views/ServiceDetailsView.vue';
import ProjectView from '@/views/ProjectView.vue';
import ContactView from '@/views/ContactView.vue';
import FaqView from '@/views/FaqView.vue';
import TeamView from '@/views/TeamView.vue';
import BlogView from '@/views/BlogView.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/about', name: 'About', component: AboutView },
  { path: '/service', name: 'Service', component: ServiceView },
  { path: '/service-details', name: 'ServiceDetails', component: ServiceDetailsView },
  { path: '/project-grid', name: 'ProjectGrid', component: ProjectView },
  { path: '/project-details', name: 'ProjectDetails', component: ProjectView },
  { path: '/contact', name: 'Contact', component: ContactView },
  { path: '/faq', name: 'Faq', component: FaqView },
  { path: '/team', name: 'Team', component: TeamView },
  { path: '/team-details', name: 'TeamDetails', component: TeamView },
  { path: '/blog', name: 'Blog', component: BlogView },
  { path: '/blog-details', name: 'BlogDetails', component: BlogView },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

export default router;
