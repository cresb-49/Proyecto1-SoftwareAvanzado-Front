<template>
  <div class="mx-auto max-w-6xl px-4 py-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-brand-800">Clientes</h1>
      <Button size="sm" variant="primary" to="/clientes/crear">+ Nuevo cliente</Button>
    </div>

    <Table
      v-model:page="page"
      v-model:search="search"
      :columns="columns"
      :items="items"
      :loading="pendingClients || pendingUsers"
      :page-size="10"
      :show-search="true"
      empty-text="No hay clientes"
    >
      <template #title>Listado de clientes</template>
    </Table>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });

import { computed, ref } from "vue";
import Button from "~/components/ui/Button.vue";
import Table from "~/components/ui/Table.vue";
import { useClientService } from "~/services/client";
import { useUserService } from "~/services/users";
import type { Client } from "~/services/client";
import type { User } from "~/services/users";

const clientSvc = useClientService();
const userSvc = useUserService();

const {
  data: clientsData,
  pending: pendingClients,
  error: errorClients,
} = await useAsyncData("clients:all", () => clientSvc.getAllClients(), {
  server: true,
});

const userIds = computed<string[]>(() => {
  const list = (clientsData.value as Client[] | null) || [];
  const ids = list
    .map((c) => c.userId)
    .filter((v): v is string => !!v && v !== "null" && v !== "undefined");
  return Array.from(new Set(ids));
});

const {
  data: usersData,
  pending: pendingUsers,
  error: errorUsers,
} = await useAsyncData(
  () => `users:byIds:${userIds.value.join(",") || "none"}`,
  () =>
    userIds.value.length
      ? userSvc.getByIds(userIds.value)
      : Promise.resolve([] as User[]),
  { watch: [userIds] }
);


const userMap = computed<Record<string, User>>(() => {
  const arr = (usersData.value as User[] | null) || []; 
  const map: Record<string, User> = {};
  for (const u of arr) map[u.id] = u;
  return map;
});

const items = computed(() => {
  const list = (clientsData.value as Client[] | null) || [];
  return list.map((c) => {
    const u = c.userId ? userMap.value[c.userId] : undefined;
    return {
      id: c.id,
      nit: c.nit,
      firstName: c.firstName ?? u?.firstNames ?? "—",
      lastName: c.lastName ?? u?.lastNames ?? "—",
      username: u?.username ?? "—",
      email: u?.email ?? "—",
    };
  });
});

const columns = [
  { key: "nit", label: "NIT", sortable: true },
  { key: "firstName", label: "Nombre", sortable: true },
  { key: "lastName", label: "Apellido", sortable: true },
  { key: "username", label: "Usuario", sortable: true },
  { key: "email", label: "Correo", sortable: true },
];

// v-models
const page = ref(1);
const search = ref("");
</script>

<style scoped></style>