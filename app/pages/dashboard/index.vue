<template>
  <div class="mx-auto max-w-7xl px-4">
    <section>
      <h2 class="text-xl font-semibold text-brand-900">
        Módulos de la aplicación
      </h2>
      <p class="mt-1 text-sm text-brand-700">
        Accede a las diferentes áreas según tus permisos.
      </p>

      <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Tarjeta de módulo -->
        <NuxtLink
          v-for="m in visibleModules"
          :key="m.key"
          :to="m.route"
          class="group block rounded-xl border border-sand-300 bg-white p-5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <div class="mb-2 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-brand-900">{{ m.name }}</h3>
            <span class="text-brand-700/70 text-lg" aria-hidden="true"> </span>
          </div>

          <p class="text-sm text-brand-700">{{ m.description }}</p>
          <div
            class="mt-3 flex flex-wrap gap-1.5"
            v-if="(Roles.ADMIN === user?.roleName || Roles.MANAGER === user?.roleName)"
          >
            <span
              v-for="r in m.roles"
              :key="r"
              :class="[
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs',
                r === Roles.ADMIN
                  ? 'border-gold-500 bg-gold-300 text-ink-900'
                  : 'border-sand-300 bg-sand-50 text-brand-700',
              ]"
              >{{ r }}</span
            >
          </div>

          <div
            class="mt-4 text-sm font-medium text-brand-700 group-hover:text-brand-600"
          >
            Ingresar →
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });
import { computed } from "vue";
import { Roles, useAuth } from "~/composables/useAuth";

interface Module {
  key: string;
  name: string;
  description: string;
  route: string;
  roles: string[];
  icon?: string;
}

// 🔧 Configuración de módulos (agrega/edita aquí)
const modules: Module[] = [
  {
    key: "hoteles",
    name: "Hoteles",
    description: "Gestiona hoteles, habitaciones y tarifas.",
    route: "/hoteles",
    roles: [Roles.ADMIN, Roles.HOTEL_MANAGER],
  },
  {
    key: "restaurantes",
    name: "Restaurantes",
    description: "Carta, mesas y reservas en restaurantes.",
    route: "/restaurantes",
    roles: [Roles.ADMIN, Roles.RESTAURANT_MANAGER],
  },
  {
    key: "reservaciones",
    name: "Reservaciones",
    description: "Crea y administra reservaciones.",
    route: "/reservaciones",
    roles: [Roles.ADMIN, Roles.HOTEL_MANAGER, Roles.HOTEL_EMPLOYEE],
  },
  {
    key: "empleados",
    name: "Empleados",
    description: "Altas, bajas y roles del personal.",
    route: "/empleados",
    roles: [Roles.ADMIN, Roles.MANAGER],
  },
  {
    key: "usuarios",
    name: "Usuarios",
    description: "Gestión de usuarios del sistema.",
    route: "/usuarios",
    roles: [Roles.ADMIN, Roles.MANAGER],
  },
  {
    key: "reportes",
    name: "Reportes",
    description: "KPIs, ventas y ocupación.",
    route: "/reportes",
    roles: [Roles.ADMIN],
  },
  {
    key: "mis_reservaciones",
    name: "Mis Reservaciones",
    description: "Consulta y gestiona tus reservaciones.",
    route: "/reservaciones/reservas",
    roles: [Roles.CUSTOMER],
  },
  {
    key: "hoteles-clientes-view",
    name: "Ver Hoteles",
    description: "Consulta la lista de hoteles disponibles y realiza reservas.",
    route: "/hoteles",
    roles: [Roles.CUSTOMER],
  },{
    key: "restaurantes-clientes-view",
    name: "Ver Restaurantes",
    description: "Consulta la lista de restaurantes disponibles y realiza reservas.",
    route: "/restaurantes",
    roles: [Roles.CUSTOMER],
  },
  {
    key: "ordenes",
    name: "Órdenes",
    description: "Consulta y gestiona las órdenes.",
    route: "/ordenes",
    roles: [Roles.ADMIN, Roles.RESTAURANT_MANAGER,Roles.RESTAURANT_EMPLOYEE],
  },
  {
    key: "mis_consumos",
    name: "Mis Consumos",
    description: "Consulta y gestiona tus consumos.",
    route: "/mis_consumos",
    roles: [Roles.CUSTOMER],
  },
  {
    key: "perfil",
    name: "Ver Perfil",
    description: "Consulta y edita tu perfil.",
    route: "/perfil",
    roles: [
      Roles.ADMIN,
      Roles.CUSTOMER,
      Roles.HOTEL_EMPLOYEE,
      Roles.HOTEL_MANAGER,
      Roles.MANAGER,
      Roles.RESTAURANT_EMPLOYEE,
      Roles.RESTAURANT_MANAGER
    ],
  },
];

// Roles del usuario actual
const { user } = useAuth();
const currentRoles = computed<string[]>(() => {
  const roles = [user.value?.roleName].filter(
    (r): r is string => typeof r === "string"
  );
  return roles;
});

const isAdmin = computed(() => currentRoles.value.includes(Roles.ADMIN));

// Filtrado por permisos (admin ve todo)
const visibleModules = computed(() =>
  modules.filter((m) => m.roles.some((r) => currentRoles.value.includes(r)))
);
</script>

<style scoped></style>
