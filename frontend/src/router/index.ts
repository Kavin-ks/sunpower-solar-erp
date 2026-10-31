import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import MainLayout from '../components/layout/MainLayout.vue';
import LoginView from '../views/LoginView.vue';
import PublicEnquiryView from '../views/PublicEnquiryView.vue';
import DashboardView from '../views/DashboardView.vue';
import EnquiriesView from '../views/EnquiriesView.vue';
import SiteSurveysView from '../views/SiteSurveysView.vue';
import QuotationsView from '../views/QuotationsView.vue';
import OrdersView from '../views/OrdersView.vue';
import InventoryView from '../views/InventoryView.vue';
import DispatchView from '../views/DispatchView.vue';
import InstallationsView from '../views/InstallationsView.vue';
import WarrantyView from '../views/WarrantyView.vue';
import ServiceTicketsView from '../views/ServiceTicketsView.vue';
import TechnicianServiceJobsView from '../views/TechnicianServiceJobsView.vue';
import MyAssignedWorkView from '../views/MyAssignedWorkView.vue';
import FinanceView from '../views/FinanceView.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { public: true },
  },
  {
    path: '/enquiry',
    name: 'PublicEnquiry',
    component: PublicEnquiryView,
    meta: { public: true },
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: DashboardView,
      },
      {
        path: 'enquiries',
        name: 'Enquiries',
        component: EnquiriesView,
      },
      {
        path: 'surveys',
        name: 'SiteSurveys',
        component: SiteSurveysView,
      },
      {
        path: 'quotations',
        name: 'Quotations',
        component: QuotationsView,
      },
      {
        path: 'orders',
        name: 'Orders',
        component: OrdersView,
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: InventoryView,
      },
      {
        path: 'dispatch',
        name: 'Dispatch',
        component: DispatchView,
      },
      {
        path: 'installations',
        name: 'Installations',
        component: InstallationsView,
      },
      {
        path: 'warranties',
        name: 'Warranties',
        component: WarrantyView,
      },
      {
        path: 'service',
        name: 'ServiceTickets',
        component: ServiceTicketsView,
      },
      {
        path: 'my-work',
        name: 'MyAssignedWork',
        component: MyAssignedWorkView,
      },
      {
        path: 'service-jobs',
        name: 'TechnicianServiceJobs',
        component: TechnicianServiceJobsView,
      },
      {
        path: 'finance',
        name: 'Finance',
        component: FinanceView,
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  if (!to.meta.public && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
